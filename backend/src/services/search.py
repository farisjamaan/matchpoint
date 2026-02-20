"""
services/search.py

Implements the Hybrid Search pipeline:
  - Dense retrieval via FAISS (cosine similarity on L2-normalised embeddings)
  - Sparse retrieval via BM25Okapi keyword matching
  - Score fusion via Reciprocal Rank Fusion (RRF)

All stateful objects (embedder, FAISSManager) are injected by the caller.
"""

from __future__ import annotations

import numpy as np
import faiss
from sentence_transformers import SentenceTransformer

from src.core.logger import get_logger
from src.db.faiss_mgr import FAISSManager

logger = get_logger(__name__)


def hybrid_search(
    query: str,
    embedder: SentenceTransformer,
    faiss_manager: FAISSManager,
    top_k: int,
    rrf_k: int,
) -> list[dict[str, str]]:
    """
    Run a config-driven RRF Hybrid Search and return the top_k most relevant
    chunks as a list of {"name": ..., "text": ...} dicts.

    Args:
        query:         Natural-language PM query.
        embedder:      Shared SentenceTransformer instance.
        faiss_manager: Loaded FAISSManager (must have is_ready == True).
        top_k:         Number of chunks to return.
        rrf_k:         RRF damping constant (typically 60).

    Raises:
        RuntimeError: If the indices have not been built yet.
    """
    if not faiss_manager.is_ready:
        raise RuntimeError(
            "Search indices are not initialised. Call POST /api/v1/ingest first."
        )

    chunk_store = faiss_manager.chunk_store
    bm25_engine = faiss_manager.bm25_engine
    bm25_id_map = faiss_manager.bm25_id_map
    index = faiss_manager.faiss_index

    # Cap candidate pool to available chunks
    search_k = min(50, len(chunk_store))

    # ------------------------------------------------------------------
    # 1. Dense vector search (FAISS)
    # ------------------------------------------------------------------
    query_emb: np.ndarray = embedder.encode(
        [query], convert_to_numpy=True
    ).astype(np.float32)
    faiss.normalize_L2(query_emb)

    _, faiss_raw_indices = index.search(query_emb, search_k)
    # FAISS returns -1 for unfilled slots; filter those out
    faiss_ranked_ids: list[str] = [
        f"chunk_{idx}" for idx in faiss_raw_indices[0] if idx != -1
    ]

    # ------------------------------------------------------------------
    # 2. Sparse keyword search (BM25)
    # ------------------------------------------------------------------
    bm25_scores: np.ndarray = bm25_engine.get_scores(query.lower().split())
    bm25_ranked_ids: list[str] = [
        bm25_id_map[idx]
        for idx in np.argsort(bm25_scores)[::-1][:search_k]
    ]

    # ------------------------------------------------------------------
    # 3. Reciprocal Rank Fusion
    # ------------------------------------------------------------------
    rrf_scores: dict[str, float] = {}

    for rank, chunk_id in enumerate(faiss_ranked_ids):
        rrf_scores[chunk_id] = rrf_scores.get(chunk_id, 0.0) + 1.0 / (rrf_k + rank + 1)

    for rank, chunk_id in enumerate(bm25_ranked_ids):
        rrf_scores[chunk_id] = rrf_scores.get(chunk_id, 0.0) + 1.0 / (rrf_k + rank + 1)

    fused = sorted(rrf_scores.items(), key=lambda item: item[1], reverse=True)

    # ------------------------------------------------------------------
    # 4. Materialise results
    # ------------------------------------------------------------------
    results: list[dict[str, str]] = []
    for chunk_id, score in fused[:top_k]:
        if chunk_id in chunk_store:
            results.append(
                {
                    "name": chunk_store[chunk_id]["name"],
                    "role": chunk_store[chunk_id].get("role", ""),
                    "text": chunk_store[chunk_id].get("raw_text", chunk_store[chunk_id]["text"]),
                }
            )

    logger.info(
        "Hybrid search returned %d chunks for query: '%.80s'", len(results), query
    )
    return results
