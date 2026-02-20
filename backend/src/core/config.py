"""
core/config.py

Loads all YAML configuration files and exposes them as typed Pydantic models.
PROJECT_ROOT is resolved at import time relative to this file's location:
  backend/src/core/config.py  →  parents[2]  →  backend/
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml
from pydantic import BaseModel

# backend/ directory — all config-relative paths resolve from here
PROJECT_ROOT: Path = Path(__file__).resolve().parents[2]


# ---------------------------------------------------------------------------
# Typed sub-models mirroring config.yaml sections
# ---------------------------------------------------------------------------


class SystemConfig(BaseModel):
    database_path: str
    faiss_dir: str
    data_folder: str


class LLMConfig(BaseModel):
    extraction_model: str
    reasoning_model: str
    temperature: float
    max_tokens: int


class RetrievalConfig(BaseModel):
    top_k_chunks: int
    rrf_k: int


# ---------------------------------------------------------------------------
# Top-level config with computed path helpers
# ---------------------------------------------------------------------------


class AppConfig(BaseModel):
    system: SystemConfig
    llm: LLMConfig
    retrieval: RetrievalConfig

    @property
    def db_file(self) -> Path:
        """Absolute path to the SQLite database file."""
        return PROJECT_ROOT / self.system.database_path

    @property
    def faiss_dir_path(self) -> Path:
        """Absolute path to the FAISS index directory."""
        return PROJECT_ROOT / self.system.faiss_dir

    @property
    def data_dir_path(self) -> Path:
        """Absolute path to the raw CV directory."""
        return PROJECT_ROOT / self.system.data_folder


# ---------------------------------------------------------------------------
# Loader helpers
# ---------------------------------------------------------------------------


def _load_yaml(filename: str) -> dict[str, Any]:
    filepath = PROJECT_ROOT / "config" / filename
    with open(filepath, "r", encoding="utf-8") as fh:
        return yaml.safe_load(fh)


def load_app_config() -> AppConfig:
    """Parse config.yaml into a fully validated AppConfig instance."""
    raw = _load_yaml("config.yaml")
    return AppConfig(**raw)


def load_prompts() -> dict[str, str]:
    """Return the raw prompts dict from prompts.yaml."""
    return _load_yaml("prompts.yaml")


def load_taxonomy() -> dict[str, Any]:
    """Return the raw taxonomy dict from skills_taxonomy.yaml."""
    return _load_yaml("skills_taxonomy.yaml")


def build_taxonomy_context(taxonomy_data: dict[str, Any]) -> str:
    """Flatten the taxonomy tree into a bullet-list string for LLM prompts."""
    lines: list[str] = []
    for _category, skills in taxonomy_data.get("categories", {}).items():
        for skill, details in skills.items():
            aliases = ", ".join(details.get("aliases", []))
            lines.append(f"- {skill} (Aliases: {aliases})")
    return "\n".join(lines)
