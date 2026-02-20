"""
main.py

FastAPI application entry point.

Startup (lifespan):
  1. Configure structured logging.
  2. Load all YAML configs.
  3. Initialise SQLiteManager and run schema setup.
  4. Instantiate AI clients (Groq, SentenceTransformer).
  5. Attempt to load existing FAISS/BM25 indices from disk;
     if absent but DB is populated, build them automatically.
  6. Attach everything to app.state for dependency-injection via Request.

Run with:
    uvicorn src.main:app --reload --port 8000
from the backend/ directory.
"""

from __future__ import annotations

import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from sentence_transformers import SentenceTransformer

from src.api.endpoints import router
from src.core.config import (
    build_taxonomy_context,
    load_app_config,
    load_prompts,
    load_taxonomy,
)
from src.core.logger import get_logger, setup_logging
from src.db.faiss_mgr import FAISSManager
from src.db.sqlite_mgr import SQLiteManager

# Configure logging before any module-level loggers fire
setup_logging()
logger = get_logger(__name__)


# ---------------------------------------------------------------------------
# Application lifespan — startup / shutdown
# ---------------------------------------------------------------------------


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Initialise shared resources on startup; release them on shutdown."""

    logger.info("=== MatchPoint backend starting up ===")

    # ------------------------------------------------------------------
    # Configuration
    # ------------------------------------------------------------------
    config = load_app_config()
    prompts = load_prompts()
    taxonomy = load_taxonomy()
    taxonomy_context = build_taxonomy_context(taxonomy)

    logger.info(
        "Config loaded — extraction_model=%s  reasoning_model=%s",
        config.llm.extraction_model,
        config.llm.reasoning_model,
    )

    # ------------------------------------------------------------------
    # Database
    # ------------------------------------------------------------------
    db_manager = SQLiteManager(config.db_file)
    db_manager.setup_database()

    # ------------------------------------------------------------------
    # AI clients
    # ------------------------------------------------------------------
    groq_api_key = os.environ.get("GROQ_API_KEY")
    if not groq_api_key:
        raise EnvironmentError(
            "GROQ_API_KEY environment variable is not set. "
            "Export it before starting the server."
        )

    groq_client = Groq(api_key=groq_api_key)
    logger.info("Groq client initialised.")

    logger.info("Loading SentenceTransformer (all-MiniLM-L6-v2)…")
    embedder = SentenceTransformer("all-MiniLM-L6-v2")
    logger.info("SentenceTransformer ready.")

    # ------------------------------------------------------------------
    # FAISS / BM25 indices
    # ------------------------------------------------------------------
    faiss_manager = FAISSManager(faiss_dir=config.faiss_dir_path, embedder=embedder)

    if not faiss_manager.load_indices():
        logger.info("No persisted indices found — attempting to build from SQLite…")
        candidates = db_manager.get_all_candidates()
        if candidates:
            faiss_manager.build_from_candidates(candidates)
        else:
            logger.warning(
                "SQLite database is empty. "
                "Call POST /api/v1/ingest to load CVs and build indices."
            )

    # ------------------------------------------------------------------
    # Attach shared state (dependency injection via Request)
    # ------------------------------------------------------------------
    app.state.config = config
    app.state.prompts = prompts
    app.state.taxonomy_context = taxonomy_context
    app.state.db_manager = db_manager
    app.state.groq_client = groq_client
    app.state.embedder = embedder
    app.state.faiss_manager = faiss_manager
    app.state.data_dir = config.data_dir_path

    logger.info("=== MatchPoint backend ready ===")

    yield  # Server is running — handle requests

    logger.info("=== MatchPoint backend shutting down ===")


# ---------------------------------------------------------------------------
# FastAPI application
# ---------------------------------------------------------------------------

app = FastAPI(
    title="MatchPoint — AI Resume Matching API",
    description=(
        "Enterprise hybrid-search resume ranking system powered by "
        "FAISS (dense), BM25 (sparse), Reciprocal Rank Fusion, and Groq LLMs."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://127.0.0.1:8080"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the API router under /api/v1
app.include_router(router, prefix="/api/v1", tags=["matching"])


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------


@app.get("/health", tags=["system"], summary="Service health probe")
async def health_check() -> dict[str, str]:
    """Lightweight liveness probe — returns 200 if the server is up."""
    return {"status": "ok", "version": "1.0.0"}
