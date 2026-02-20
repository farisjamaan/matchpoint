"""
core/logger.py

Configures the root Python logger once at application startup.
Every module obtains its own child logger via get_logger(__name__).
"""

from __future__ import annotations

import logging
import sys


def setup_logging(level: int = logging.INFO) -> None:
    """
    Configure the root logger with a structured format.
    Call this exactly once at application startup (main.py lifespan).
    Subsequent calls are safe but no-ops due to the guard.
    """
    root = logging.getLogger()
    if root.handlers:
        # Already configured — skip to avoid duplicate handlers.
        return

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(
        logging.Formatter(
            fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
            datefmt="%Y-%m-%dT%H:%M:%S",
        )
    )
    root.setLevel(level)
    root.addHandler(handler)


def get_logger(name: str) -> logging.Logger:
    """Return a named child logger. Call at module level: logger = get_logger(__name__)."""
    return logging.getLogger(name)
