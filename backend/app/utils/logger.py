"""
AI-Based Student Placement Prediction System
============================================
Logging Utility (app/utils/logger.py)

Centralised logging configuration for the FastAPI backend.
Supports JSON-compatible format suitable for cloud log aggregators.
"""

import logging
import sys


def setup_logging(level: str = "INFO") -> None:
    """
    Configure root logger with a professional format.

    Args:
        level: Logging level string (DEBUG, INFO, WARNING, ERROR, CRITICAL).
    """
    log_level = getattr(logging, level.upper(), logging.INFO)

    # ── Formatter ──────────────────────────────────────────────────────────────
    formatter = logging.Formatter(
        fmt="%(asctime)s  [%(levelname)-8s]  %(name)s — %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # ── Stream handler (stdout) ────────────────────────────────────────────────
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)

    # ── Root logger ───────────────────────────────────────────────────────────
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)

    # Avoid adding duplicate handlers on hot-reload
    if not root_logger.handlers:
        root_logger.addHandler(handler)

    # Suppress noisy third-party loggers
    for noisy in ("uvicorn.access", "httpx", "httpcore"):
        logging.getLogger(noisy).setLevel(logging.WARNING)
