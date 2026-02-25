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
    target_roles: list[str] | None = None,
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
        target_roles:  Optional list of role levels to hard-filter on (e.g. ["Consultant II"]).
                       Filtering is applied after RRF fusion but before passing chunks to the LLM,
                       so excluded candidates never cost LLM tokens. Empty list = no filter.

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

    # Candidate pool: retrieve enough chunks so RRF has a wide base to fuse from.
    # Scale with top_k so that as top_k grows the pool stays proportionally large.
    search_k = min(len(chunk_store), max(top_k * 3, 120))

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
    # Build a normalised set of allowed roles for fast lookup.
    # Matching is case-insensitive substring so "Consultant II" matches
    # a stored role of "EY Consultant II" or "consultant ii".
    normalised_targets = (
        [r.lower() for r in target_roles] if target_roles else []
    )

    def _role_allowed(chunk_role: str) -> bool:
        if not normalised_targets:
            return True
        chunk_role_lower = (chunk_role or "").lower()
        return any(t in chunk_role_lower for t in normalised_targets)

    # Track which candidate names have already been admitted so we apply the
    # role filter at candidate granularity (not chunk granularity), avoiding
    # the false-negative problem where some chunks lack role metadata.
    admitted_names: set[str] = set()
    rejected_names: set[str] = set()

    results: list[dict[str, str]] = []
    for chunk_id, score in fused:
        if chunk_id not in chunk_store:
            continue
        chunk = chunk_store[chunk_id]
        name = chunk["name"]

        # Once we know a candidate is rejected, skip all their chunks.
        if name in rejected_names:
            continue

        # First time we see this candidate: decide admission based on role.
        if name not in admitted_names:
            if _role_allowed(chunk.get("role", "")):
                admitted_names.add(name)
            else:
                rejected_names.add(name)
                continue

        results.append(
            {
                "name": name,
                "role": chunk.get("role", ""),
                "text": chunk.get("raw_text", chunk["text"]),
            }
        )
        if len(results) >= top_k:
            break

    if normalised_targets:
        logger.info(
            "Role filter active %s — admitted %d candidate(s), rejected %d",
            target_roles,
            len(admitted_names),
            len(rejected_names),
        )
    logger.info(
        "Hybrid search returned %d chunks for query: '%.80s'", len(results), query
    )
    return results
