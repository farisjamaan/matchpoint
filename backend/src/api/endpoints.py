"""
api/endpoints.py

Defines the two primary API routes:
  POST /api/v1/ingest  — scan raw_cv/, ingest to SQLite, rebuild indices
  POST /api/v1/search  — run Hybrid Search + LLM reranking for a PM query

All heavyweight dependencies are pulled from app.state (set during lifespan
in main.py) so nothing is instantiated inside these handlers.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request, status

from src.core.logger import get_logger
from src.models.schemas import IngestResponse, SearchRequest, SearchResponse
from src.services import evaluator, ingestion, search

logger = get_logger(__name__)

router = APIRouter()


# ---------------------------------------------------------------------------
# POST /ingest
# ---------------------------------------------------------------------------


@router.post(
    "/ingest",
    response_model=IngestResponse,
    status_code=status.HTTP_200_OK,
    summary="Ingest PPTX CVs",
    description=(
        "Scans the configured `data/raw_cv/` directory for `.pptx` files, "
        "extracts metadata via the Groq LLM, stores records in SQLite, "
        "and rebuilds the FAISS + BM25 search indices."
    ),
)
async def ingest_cvs(request: Request) -> IngestResponse:
    state = request.app.state

    try:
        count = ingestion.ingest_all_pptx(
            data_dir=state.data_dir,
            db_manager=state.db_manager,
            groq_client=state.groq_client,
            extraction_model=state.config.llm.extraction_model,
            temperature=state.config.llm.temperature,
        )
    except FileNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except Exception as exc:
        logger.error("Unexpected error during ingestion: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ingestion failed. Check server logs for details.",
        )

    # Rebuild indices from the (now-updated) SQLite store
    try:
        candidates = state.db_manager.get_all_candidates()
        state.faiss_manager.build_from_candidates(candidates)
    except Exception as exc:
        logger.error("Index rebuild failed after ingestion: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ingestion succeeded but index rebuild failed. Check server logs.",
        )

    return IngestResponse(
        message="Ingestion and index rebuild complete.",
        files_ingested=count,
    )


# ---------------------------------------------------------------------------
# POST /search
# ---------------------------------------------------------------------------


@router.post(
    "/search",
    response_model=SearchResponse,
    status_code=status.HTTP_200_OK,
    summary="Search and rank candidates",
    description=(
        "Runs the full pipeline: Hybrid Search (FAISS + BM25 via RRF) → "
        "Groq LLM reranking. Returns candidates ranked by fit score with "
        "traceable evidence from their CVs."
    ),
)
async def search_candidates(
    payload: SearchRequest,
    request: Request,
) -> SearchResponse:
    state = request.app.state

    if not state.faiss_manager.is_ready:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Search indices are not ready. Call POST /api/v1/ingest first.",
        )

    try:
        top_chunks = search.hybrid_search(
            query=payload.query,
            embedder=state.embedder,
            faiss_manager=state.faiss_manager,
            top_k=state.config.retrieval.top_k_chunks,
            rrf_k=state.config.retrieval.rrf_k,
        )
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)
        )
    except Exception as exc:
        logger.error("Hybrid search failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Search failed. Check server logs for details.",
        )

    try:
        results = evaluator.evaluate_candidates(
            top_chunks=top_chunks,
            pm_query=payload.query,
            pm_skills=payload.required_skills,
            groq_client=state.groq_client,
            reasoning_model=state.config.llm.reasoning_model,
            temperature=state.config.llm.temperature,
            max_tokens=state.config.llm.max_tokens,
            prompt_template=state.prompts["evaluation_prompt"],
            taxonomy_context=state.taxonomy_context,
        )
    except Exception as exc:
        logger.error("LLM evaluation failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Candidate evaluation failed. Check server logs for details.",
        )

    return SearchResponse(query=payload.query, results=results)
