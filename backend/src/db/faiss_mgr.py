"""
db/faiss_mgr.py

Manages the in-memory and on-disk Hybrid Search indices:
  - FAISS IndexFlatIP  (dense cosine similarity via normalized inner product)
  - BM25Okapi          (sparse keyword matching)

Both indices are built together, serialized atomically, and loaded back
as a single unit so they stay in sync.
"""

from __future__ import annotations

import pickle
from pathlib import Path

import faiss
import numpy as np
from rank_bm25 import BM25Okapi
from sentence_transformers import SentenceTransformer

from src.core.logger import get_logger

logger = get_logger(__name__)

_INDEX_FILENAME = "index.faiss"
_META_FILENAME = "metadata.pkl"


class FAISSManager:
    """
    Holds the live FAISS index and BM25 engine in memory.
    Built once (on /ingest) and reloaded from disk on subsequent restarts.
    """

    def __init__(self, faiss_dir: Path, embedder: SentenceTransformer) -> None:
        self.faiss_dir = faiss_dir
        self.embedder = embedder
        faiss_dir.mkdir(parents=True, exist_ok=True)

        self._index_path = faiss_dir / _INDEX_FILENAME
        self._meta_path = faiss_dir / _META_FILENAME

        # In-memory state — populated by build_from_candidates or load_indices
        self.chunk_store: dict[str, dict] = {}
        self.faiss_index: faiss.Index | None = None
        self.bm25_engine: BM25Okapi | None = None
        self.bm25_id_map: dict[int, str] = {}

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    @property
    def is_ready(self) -> bool:
        """True when both indices are loaded and the chunk store is populated."""
        return self.faiss_index is not None and bool(self.chunk_store)

    def build_from_candidates(self, candidates: list[dict]) -> None:
        """
        Build FAISS + BM25 indices from a list of candidate dicts
        (as returned by SQLiteManager.get_all_candidates).
        Persists to disk after a successful build.
        """
        chunk_store: dict[str, dict] = {}
        bm25_corpus: list[list[str]] = []
        vector_texts: list[str] = []
        chunk_idx: int = 0

        for row in candidates:
            name: str = row["name"]
            role: str = row.get("role") or ""
            content: str = row["content"]

            for chunk_text in [c.strip() for c in content.split("\n\n") if c.strip()]:
                chunk_id = f"chunk_{chunk_idx}"
                # Prepend candidate context so every chunk is self-contained
                enriched = f"Candidate: {name} | Role: {role}\n{chunk_text}"

                chunk_store[chunk_id] = {"name": name, "text": enriched}
                bm25_corpus.append(enriched.lower().split())
                vector_texts.append(enriched)
                chunk_idx += 1

        if not vector_texts:
            logger.warning("No chunks produced from candidates — indices NOT built.")
            return

        logger.info("Encoding %d chunks with sentence-transformers…", len(vector_texts))
        embeddings: np.ndarray = self.embedder.encode(
            vector_texts, show_progress_bar=False, convert_to_numpy=True
        ).astype(np.float32)

        faiss.normalize_L2(embeddings)
        index = faiss.IndexFlatIP(embeddings.shape[1])
        index.add(embeddings)

        bm25_engine = BM25Okapi(bm25_corpus)
        bm25_id_map = {i: f"chunk_{i}" for i in range(len(bm25_corpus))}

        self._persist(index, chunk_store, bm25_engine, bm25_id_map)

        # Activate in memory
        self.chunk_store = chunk_store
        self.faiss_index = index
        self.bm25_engine = bm25_engine
        self.bm25_id_map = bm25_id_map

        logger.info(
            "Hybrid indices built: %d vectors, %d BM25 docs.",
            index.ntotal,
            len(bm25_corpus),
        )

    def load_indices(self) -> bool:
        """
        Attempt to restore indices from disk.
        Returns True on success, False when files are absent or corrupt.
        """
        if not self._index_path.exists() or not self._meta_path.exists():
            logger.info("No persisted indices found at %s.", self.faiss_dir)
            return False

        try:
            index = faiss.read_index(str(self._index_path))

            with open(self._meta_path, "rb") as fh:
                meta: dict = pickle.load(fh)

            self.faiss_index = index
            self.chunk_store = meta["chunk_store"]
            self.bm25_engine = meta["bm25_engine"]
            self.bm25_id_map = meta["bm25_id_map"]

            logger.info(
                "Loaded FAISS index (%d vectors) and BM25 from disk.",
                index.ntotal,
            )
            return True

        except (pickle.UnpicklingError, KeyError, RuntimeError) as exc:
            logger.error("Failed to deserialize indices: %s", exc)
            return False

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _persist(
        self,
        index: faiss.Index,
        chunk_store: dict[str, dict],
        bm25_engine: BM25Okapi,
        bm25_id_map: dict[int, str],
    ) -> None:
        faiss.write_index(index, str(self._index_path))
        with open(self._meta_path, "wb") as fh:
            pickle.dump(
                {
                    "chunk_store": chunk_store,
                    "bm25_engine": bm25_engine,
                    "bm25_id_map": bm25_id_map,
                },
                fh,
            )
        logger.info("Indices persisted to %s.", self.faiss_dir)
