"""
models/schemas.py

Pydantic models that define the contract between the API layer and
the service layer. Every request and response object lives here.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Request models
# ---------------------------------------------------------------------------


class SearchRequest(BaseModel):
    """Body for POST /api/v1/search."""

    query: str = Field(
        ...,
        min_length=10,
        description="Natural-language project description from the PM.",
        examples=["We need a technical lead with NLP and healthcare experience."],
    )
    required_skills: list[str] = Field(
        default_factory=list,
        description="Explicit skill keywords to weight during evaluation.",
        examples=[["NLP", "Machine Learning", "Healthcare"]],
    )


# ---------------------------------------------------------------------------
# Response models
# ---------------------------------------------------------------------------


class CandidateResult(BaseModel):
    """A single evaluated candidate returned by the ranking pipeline."""

    name: str = Field(..., description="Candidate's full name extracted from the CV.")
    role: str | None = Field(None, description="Candidate's job title extracted from the CV.")
    score: int = Field(..., ge=0, le=100, description="Fit score 0–100.")
    rationale: str = Field(..., description="LLM-generated explanation of the score.")
    evidence: list[str] = Field(
        default_factory=list,
        description="Verbatim quotes from the CV that justify the score.",
    )
    email: str | None = Field(None, description="Candidate's email address.")
    phone: str | None = Field(None, description="Candidate's phone number.")


class IngestResponse(BaseModel):
    """Response for POST /api/v1/ingest."""

    message: str
    files_ingested: int


class SearchResponse(BaseModel):
    """Response for POST /api/v1/search."""

    query: str
    results: list[CandidateResult]
