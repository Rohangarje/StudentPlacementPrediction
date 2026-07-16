"""
AI-Based Student Placement Prediction System
============================================
Data Service (app/services/data_service.py)

Loads the raw dataset and computes aggregated statistics
consumed by the Dashboard and Dataset Analysis pages.
Results are cached in memory after first load.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict, List

import numpy as np
import pandas as pd

from app.models.schemas import DatasetStatsResponse

logger = logging.getLogger(__name__)

# ─── Path to dataset ───────────────────────────────────────────────────────────
_BACKEND_DIR = Path(__file__).resolve().parents[2]          # backend/
_DATA_PATH   = _BACKEND_DIR.parent / "dataset" / "train.xls"

TARGET_COL = "Placement_Status"
ID_COL     = "Student_ID"


class DataService:
    """
    Service that loads and preprocesses the student dataset once on startup
    and provides computed analytics to the API routes.

    All heavy computation happens in __init__; subsequent calls just return
    the cached results.
    """

    def __init__(self) -> None:
        self._df_raw: pd.DataFrame  = pd.DataFrame()
        self._stats_cache: DatasetStatsResponse | None = None
        self._correlation_cache: Dict[str, Any] | None = None
        self._load()

    # ── Private ────────────────────────────────────────────────────────────────
    def _load(self) -> None:
        """Load and lightly clean the dataset."""
        if not _DATA_PATH.exists():
            logger.warning("Dataset not found at %s — data endpoints will be empty.", _DATA_PATH)
            return

        try:
            df = pd.read_csv(_DATA_PATH)
        except Exception:
            df = pd.read_excel(_DATA_PATH)

        if ID_COL in df.columns:
            df = df.drop(columns=[ID_COL])

        df = df.drop_duplicates()

        # Fill missing values
        for col in df.columns:
            if df[col].isnull().any():
                if df[col].dtype == "object":
                    df[col] = df[col].fillna(df[col].mode()[0])
                else:
                    df[col] = df[col].fillna(df[col].median())

        self._df_raw = df
        logger.info("Dataset loaded: %d rows, %d columns", len(df), df.shape[1])

    def _group_counts(self, group_col: str) -> Dict[str, Dict[str, int]]:
        """
        Return placement counts grouped by a categorical column.
        Example output: {"CSE": {"Placed": 200, "Not Placed": 50}, ...}
        """
        if self._df_raw.empty or group_col not in self._df_raw.columns:
            return {}
        grouped = (
            self._df_raw.groupby([group_col, TARGET_COL])
            .size()
            .unstack(fill_value=0)
        )
        return {
            str(idx): {str(col): int(val) for col, val in row.items()}
            for idx, row in grouped.iterrows()
        }

    # ── Public API ─────────────────────────────────────────────────────────────
    def get_stats(self) -> DatasetStatsResponse:
        """Return cached dataset statistics for the dashboard."""
        if self._stats_cache is not None:
            return self._stats_cache

        df = self._df_raw

        if df.empty:
            return DatasetStatsResponse(
                total_students=0, placed_count=0, not_placed_count=0,
                placement_rate=0.0, average_cgpa=0.0, average_internships=0.0,
                average_projects=0.0, average_aptitude=0.0,
                placement_by_branch={}, placement_by_gender={}, placement_by_degree={},
                cgpa_distribution=[],
            )

        placed_mask      = df[TARGET_COL] == "Placed"
        placed_count     = int(placed_mask.sum())
        not_placed_count = int((~placed_mask).sum())
        total            = len(df)

        # CGPA histogram (20 bins)
        cgpa_series = df["CGPA"].dropna()
        bins = np.linspace(cgpa_series.min(), cgpa_series.max(), 21)
        counts, edges = np.histogram(cgpa_series, bins=bins)
        cgpa_distribution: List[Dict[str, Any]] = [
            {"range": f"{edges[i]:.1f}–{edges[i+1]:.1f}", "count": int(counts[i])}
            for i in range(len(counts))
        ]

        self._stats_cache = DatasetStatsResponse(
            total_students=total,
            placed_count=placed_count,
            not_placed_count=not_placed_count,
            placement_rate=round(placed_count / total * 100, 2),
            average_cgpa=round(float(df["CGPA"].mean()), 2),
            average_internships=round(float(df["Internships"].mean()), 2),
            average_projects=round(float(df["Projects"].mean()), 2),
            average_aptitude=round(float(df["Aptitude_Test_Score"].mean()), 2),
            placement_by_branch=self._group_counts("Branch"),
            placement_by_gender=self._group_counts("Gender"),
            placement_by_degree=self._group_counts("Degree"),
            cgpa_distribution=cgpa_distribution,
        )
        return self._stats_cache

    def get_correlation(self) -> Dict[str, Any]:
        """Return correlation matrix for numeric columns."""
        if self._correlation_cache is not None:
            return self._correlation_cache

        df = self._df_raw
        if df.empty:
            return {"columns": [], "data": []}

        num_df = df.select_dtypes(include=np.number)
        corr   = num_df.corr().round(3)

        self._correlation_cache = {
            "columns": corr.columns.tolist(),
            "data":    corr.values.tolist(),
        }
        return self._correlation_cache

    def get_raw_sample(self, n: int = 100) -> List[Dict[str, Any]]:
        """Return the first n rows as a list of dicts."""
        if self._df_raw.empty:
            return []
        return self._df_raw.head(n).to_dict(orient="records")

    @property
    def is_loaded(self) -> bool:
        return not self._df_raw.empty
