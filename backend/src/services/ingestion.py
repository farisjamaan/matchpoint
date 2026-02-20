"""
services/ingestion.py

Handles the two-phase data ingestion pipeline:
  1. parse_pptx_with_traceability  — extract tagged text from a .pptx file
  2. extract_metadata_with_llm     — call Groq to pull structured profile data
  3. ingest_all_pptx               — orchestrate both phases across the data dir

Dependencies (SQLiteManager, Groq client, model names) are injected by the
caller; nothing is instantiated globally inside this module.
"""

from __future__ import annotations

import json
from pathlib import Path

from groq import Groq
from pptx import Presentation
from pptx.exc import PackageNotFoundError

from src.core.logger import get_logger
from src.db.sqlite_mgr import SQLiteManager

logger = get_logger(__name__)


# ---------------------------------------------------------------------------
# PPTX parser
# ---------------------------------------------------------------------------


def parse_pptx_with_traceability(filepath: Path) -> str:
    """
    Extract all text from a .pptx file, wrapping every non-empty line with
    a positional tag for downstream traceability:

        <s{slide}_p{shape}>{line text}</s{slide}_p{shape}>

    Each shape's lines are grouped into a block; blocks are separated by
    double newlines so downstream chunking (split on "\\n\\n") produces
    one chunk per shape rather than one giant chunk per candidate.
    Raises PackageNotFoundError if the file is not a valid .pptx.
    """
    prs = Presentation(str(filepath))
    shape_blocks: list[str] = []

    for slide_num, slide in enumerate(prs.slides, start=1):
        for shape_num, shape in enumerate(slide.shapes, start=1):
            if not hasattr(shape, "text"):
                continue
            lines: list[str] = []
            for line in shape.text.strip().split("\n"):
                stripped = line.strip()
                if stripped:
                    tag = f"s{slide_num}_p{shape_num}"
                    lines.append(f"<{tag}>{stripped}</{tag}>")
            if lines:
                shape_blocks.append("\n".join(lines))

    return "\n\n".join(shape_blocks)


# ---------------------------------------------------------------------------
# LLM metadata extractor
# ---------------------------------------------------------------------------


def extract_metadata_with_llm(
    cv_content: str,
    groq_client: Groq,
    extraction_model: str,
    temperature: float,
) -> dict[str, str | None]:
    """
    Ask the LLM to extract {name, role, email, phone} from the first 2 000
    characters of the tagged CV content.

    Returns a dict with those four keys; falls back to safe defaults on any
    Groq or JSON parsing error without crashing the ingestion pipeline.
    """
    _FALLBACK: dict[str, str | None] = {
        "name": "Unknown",
        "role": None,
        "email": None,
        "phone": None,
    }

    prompt = (
        "Extract core profile details. "
        "Return ONLY a valid JSON object with keys: "
        '"name", "role", "email", "phone".\n'
        f"CV Text:\n{cv_content[:2000]}"
    )

    try:
        response = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=extraction_model,
            temperature=temperature,
            response_format={"type": "json_object"},
        )
        return json.loads(response.choices[0].message.content)

    except json.JSONDecodeError as exc:
        logger.error("LLM returned invalid JSON during metadata extraction: %s", exc)
        return _FALLBACK

    except Exception as exc:  # Groq API errors, network issues, etc.
        logger.error("Groq API call failed during metadata extraction: %s", exc)
        return _FALLBACK


# ---------------------------------------------------------------------------
# Orchestrator
# ---------------------------------------------------------------------------


def ingest_all_pptx(
    data_dir: Path,
    db_manager: SQLiteManager,
    groq_client: Groq,
    extraction_model: str,
    temperature: float,
) -> int:
    """
    Scan data_dir for .pptx files, parse + extract metadata for each,
    and upsert into SQLite.

    Returns the count of successfully ingested files.
    Raises FileNotFoundError if data_dir does not exist.
    """
    if not data_dir.exists():
        raise FileNotFoundError(
            f"Data directory not found: {data_dir}. "
            "Create it and add .pptx files before calling /ingest."
        )

    pptx_files = list(data_dir.glob("*.pptx"))
    if not pptx_files:
        logger.warning("No .pptx files found in %s.", data_dir)
        return 0

    logger.info("Found %d .pptx file(s) to ingest.", len(pptx_files))
    ingested_count = 0

    for filepath in pptx_files:
        filename = filepath.name
        logger.info("Processing: %s", filename)

        try:
            content = parse_pptx_with_traceability(filepath)
        except PackageNotFoundError:
            logger.error("Skipping %s — not a valid .pptx file.", filename)
            continue
        except Exception as exc:
            logger.error("Failed to parse %s: %s", filename, exc)
            continue

        metadata = extract_metadata_with_llm(
            cv_content=content,
            groq_client=groq_client,
            extraction_model=extraction_model,
            temperature=temperature,
        )

        try:
            db_manager.upsert_candidate(
                filename=filename,
                name=metadata.get("name") or "Unknown",
                role=metadata.get("role"),
                email=metadata.get("email"),
                phone=metadata.get("phone"),
                content=content,
            )
            ingested_count += 1
        except Exception as exc:
            logger.error("Failed to write %s to SQLite: %s", filename, exc)

    logger.info(
        "Ingestion complete: %d / %d files stored.", ingested_count, len(pptx_files)
    )
    return ingested_count
