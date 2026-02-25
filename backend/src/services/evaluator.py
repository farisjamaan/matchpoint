"""
services/evaluator.py

Takes the top chunks from the hybrid search, groups them by candidate,
and calls the Groq reasoning model to produce a structured score,
rationale, and traceable evidence for each candidate.

All external dependencies (Groq client, model names, prompt template,
taxonomy context) are injected by the caller.
"""

from __future__ import annotations

import json

from groq import Groq

from src.core.logger import get_logger
from src.models.schemas import CandidateResult

logger = get_logger(__name__)


def evaluate_candidates(
    top_chunks: list[dict[str, str]],
    pm_query: str,
    pm_skills: list[str],
    groq_client: Groq,
    reasoning_model: str,
    temperature: float,
    max_tokens: int,
    prompt_template: str,
    taxonomy_context: str,
    target_roles: list[str] | None = None,
) -> list[CandidateResult]:
    """
    Evaluate every candidate represented in top_chunks and return a
    score-sorted list of CandidateResult objects.

    Args:
        top_chunks:       Output of hybrid_search — list of {"name", "text"}.
        pm_query:         The PM's natural-language project description.
        pm_skills:        Explicit skill keywords to highlight in the prompt.
        target_roles:     Optional list of desired seniority levels (e.g. ["Consultant II", "Senior Consultant"]).
        groq_client:      Injected Groq API client.
        reasoning_model:  Groq model ID for reasoning (e.g. llama-3.3-70b-versatile).
        temperature:      Sampling temperature (0.0 for deterministic output).
        prompt_template:  f-string template from prompts.yaml.
        taxonomy_context: Pre-flattened skills taxonomy bullet list.

    Returns:
        List of CandidateResult sorted by score descending.
    """
    # ------------------------------------------------------------------
    # 1. Group chunks by candidate name
    # ------------------------------------------------------------------
    candidates_content: dict[str, str] = {}
    candidates_role: dict[str, str] = {}
    for chunk in top_chunks:
        name = chunk["name"]
        candidates_content.setdefault(name, "")
        candidates_content[name] += chunk["text"] + "\n\n"
        if name not in candidates_role:
            candidates_role[name] = chunk.get("role", "") or ""

    logger.info(
        "Evaluating %d unique candidate(s) against query: '%.80s'",
        len(candidates_content),
        pm_query,
    )

    # ------------------------------------------------------------------
    # 2. Call Groq for each candidate
    # ------------------------------------------------------------------
    results: list[CandidateResult] = []

    for name, content in candidates_content.items():
        prompt = prompt_template.format(
            pm_skills=", ".join(pm_skills) if pm_skills else "Not specified",
            pm_desc=pm_query,
            target_role=", ".join(target_roles) if target_roles else "Any",
            taxonomy=taxonomy_context,
            content=content,
        )

        try:
            response = groq_client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model=reasoning_model,
                temperature=temperature,
                max_tokens=max_tokens,
                response_format={"type": "json_object"},
            )
            raw: dict = json.loads(response.choices[0].message.content)

            results.append(
                CandidateResult(
                    name=name,
                    role=candidates_role.get(name) or None,
                    score=int(raw.get("score", 0)),
                    rationale=raw.get("rationale", ""),
                    evidence=raw.get("evidence", []),
                )
            )
            logger.info("Scored '%s': %s / 100", name, raw.get("score", 0))

        except json.JSONDecodeError as exc:
            logger.error(
                "LLM returned invalid JSON for candidate '%s': %s", name, exc
            )
        except ValueError as exc:
            # e.g. score field is not castable to int
            logger.error(
                "Unexpected response schema for candidate '%s': %s", name, exc
            )
        except Exception as exc:
            # Groq API errors (rate limits, network issues) — re-raise so the
            # caller gets a proper 500 instead of a silent empty result set.
            logger.error("Groq API call failed for candidate '%s': %s", name, exc)
            raise

    # ------------------------------------------------------------------
    # 3. Sort and return
    # ------------------------------------------------------------------
    results.sort(key=lambda r: r.score, reverse=True)
    logger.info("Evaluation complete. Top candidate: %s", results[0].name if results else "none")
    return results
