"""
AI-Based Student Placement Prediction System
============================================
Predictor Service (app/services/predictor.py)

Loads the pre-trained ML model (placement_prediction_model.pkl)
and label encoders (label_encoder.pkl) from disk on startup.
Provides predict() and batch_predict() methods consumed by the API routes.

IMPORTANT: The model is NOT retrained — only inference is performed here.
"""

from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

from app.models.schemas import (
    BatchPredictionItem,
    BatchPredictionResponse,
    FeatureImportanceItem,
    FeatureImportanceResponse,
    MetricsResponse,
    ModelInfoResponse,
    ModelMetrics,
    PredictionResponse,
    StudentInput,
)

logger = logging.getLogger(__name__)

# ─── Paths ─────────────────────────────────────────────────────────────────────
_BACKEND_DIR = Path(__file__).resolve().parents[2]          # backend/
_MODELS_DIR  = _BACKEND_DIR.parent / "models"               # ../models/
_MODEL_PATH  = _MODELS_DIR / "placement_prediction_model.pkl"
_LE_PATH     = _MODELS_DIR / "label_encoder.pkl"
_DATA_PATH   = _BACKEND_DIR.parent / "dataset" / "train.xls"

# ─── Column order used during training ────────────────────────────────────────
FEATURE_COLUMNS = [
    "Age",
    "Gender",
    "Degree",
    "Branch",
    "CGPA",
    "Internships",
    "Projects",
    "Coding_Skills",
    "Communication_Skills",
    "Aptitude_Test_Score",
    "Soft_Skills_Rating",
    "Certifications",
    "Backlogs",
]

TARGET_COL    = "Placement_Status"
CAT_COLS      = ["Gender", "Degree", "Branch"]
RANDOM_STATE  = 42
TEST_SIZE     = 0.20


def _confidence_tier(prob: float) -> str:
    """Map placement probability to a human-readable confidence tier."""
    if prob >= 70:
        return "High"
    if prob >= 45:
        return "Medium"
    return "Low"


class PlacementPredictor:
    """
    Singleton service that loads the saved model artifacts and exposes
    prediction methods for the API layer.

    Responsibilities:
    - Load placement_prediction_model.pkl  (best trained sklearn model)
    - Load label_encoder.pkl              (dict of LabelEncoder per column)
    - Encode categorical inputs at inference time
    - Return structured prediction + probability
    """

    def __init__(self) -> None:
        self._model: Any                          = None
        self._label_encoders: Dict[str, LabelEncoder] = {}
        self._model_name: str                     = "Unknown"
        self._target_classes: List[str]           = []
        self._placed_idx: int                     = 1

        # Computed metrics (populated lazily)
        self._metrics_cache: Optional[MetricsResponse] = None
        self._fi_cache: Optional[FeatureImportanceResponse] = None

        self._load_artifacts()

    # ── Private helpers ────────────────────────────────────────────────────────
    def _load_artifacts(self) -> None:
        """Load model + label encoders from disk."""
        if not _MODEL_PATH.exists():
            raise FileNotFoundError(
                f"Model file not found: {_MODEL_PATH}\n"
                "Please run train_model.py first."
            )
        if not _LE_PATH.exists():
            raise FileNotFoundError(
                f"Label encoder file not found: {_LE_PATH}\n"
                "Please run train_model.py first."
            )

        self._model = joblib.load(_MODEL_PATH)
        self._label_encoders = joblib.load(_LE_PATH)
        self._model_name = type(self._model).__name__

        # Identify which class index corresponds to "Placed"
        if TARGET_COL in self._label_encoders:
            classes = list(self._label_encoders[TARGET_COL].classes_)
            self._target_classes = classes
            self._placed_idx = classes.index("Placed") if "Placed" in classes else 1
        else:
            self._target_classes = ["Not Placed", "Placed"]
            self._placed_idx = 1

        logger.info("Model loaded: %s", self._model_name)
        logger.info("Target classes: %s", self._target_classes)

    def _encode_input(self, student: StudentInput) -> pd.DataFrame:
        """
        Convert a StudentInput schema into a model-ready DataFrame row.
        Categorical columns are label-encoded using the saved encoders.
        """
        # Normalise B.E. → B.Tech (both map to same class in dataset)
        degree = "B.Tech" if student.degree == "B.E." else student.degree

        # Map schema field names to dataset column names
        raw = {
            "Age":                   student.age,
            "Gender":                student.gender,
            "Degree":                degree,
            "Branch":                student.branch,
            "CGPA":                  student.cgpa,
            "Internships":           student.internships,
            "Projects":              student.projects,
            "Coding_Skills":         student.coding_skills,
            "Communication_Skills":  student.communication_skills,
            "Aptitude_Test_Score":   student.aptitude_score,
            "Soft_Skills_Rating":    student.soft_skills,
            "Certifications":        student.certifications,
            "Backlogs":              student.backlogs,
        }

        df = pd.DataFrame([raw])

        # Label-encode categorical columns
        for col in CAT_COLS:
            if col in self._label_encoders:
                le: LabelEncoder = self._label_encoders[col]
                try:
                    df[col] = le.transform(df[col].astype(str))
                except ValueError:
                    # Unseen label — use the most common class (index 0)
                    logger.warning("Unseen label '%s' in column '%s'; using 0.", df[col].iloc[0], col)
                    df[col] = 0

        return df[FEATURE_COLUMNS]

    # ── Public API ─────────────────────────────────────────────────────────────
    def predict(self, student: StudentInput) -> PredictionResponse:
        """
        Run inference for a single student.

        Args:
            student: Validated StudentInput schema.

        Returns:
            PredictionResponse with label, probabilities, and confidence.
        """
        df = self._encode_input(student)
        prediction_encoded = self._model.predict(df)[0]
        probabilities      = self._model.predict_proba(df)[0]

        # Decode label
        if TARGET_COL in self._label_encoders:
            label = self._label_encoders[TARGET_COL].inverse_transform([prediction_encoded])[0]
        else:
            label = "Placed" if prediction_encoded == 1 else "Not Placed"

        placed_prob     = float(probabilities[self._placed_idx]) * 100
        not_placed_prob = 100.0 - placed_prob

        return PredictionResponse(
            prediction=label,
            placement_probability=round(placed_prob, 2),
            not_placed_probability=round(not_placed_prob, 2),
            model_used=self._model_name,
            confidence=_confidence_tier(placed_prob),
            input_summary=student.model_dump(),
        )

    def batch_predict(self, students: List[StudentInput]) -> BatchPredictionResponse:
        """
        Run inference for multiple students at once.

        Args:
            students: List of validated StudentInput schemas.

        Returns:
            BatchPredictionResponse with per-student results and summary stats.
        """
        predictions: List[BatchPredictionItem] = []
        placed_count = 0

        for idx, student in enumerate(students):
            result = self.predict(student)
            if result.prediction == "Placed":
                placed_count += 1
            predictions.append(
                BatchPredictionItem(
                    index=idx,
                    prediction=result.prediction,
                    placement_probability=result.placement_probability,
                    not_placed_probability=result.not_placed_probability,
                    confidence=result.confidence,
                )
            )

        total        = len(students)
        not_placed_count = total - placed_count
        rate         = round(placed_count / total * 100, 2)

        return BatchPredictionResponse(
            total=total,
            placed_count=placed_count,
            not_placed_count=not_placed_count,
            placement_rate=rate,
            model_used=self._model_name,
            predictions=predictions,
        )

    def get_model_info(self) -> ModelInfoResponse:
        """Return metadata about the loaded model."""
        return ModelInfoResponse(
            model_type=type(self._model).__name__,
            model_name=self._model_name,
            features=FEATURE_COLUMNS,
            feature_count=len(FEATURE_COLUMNS),
            target_classes=self._target_classes,
            allowed_genders=["Male", "Female"],
            allowed_degrees=["B.Tech", "B.E.", "B.Sc", "BCA", "MCA"],
            allowed_branches=["CSE", "ECE", "ME", "Civil", "IT"],
            version="2.0.0",
        )

    @property
    def is_loaded(self) -> bool:
        """Return True if the model is successfully loaded."""
        return self._model is not None

    def get_metrics(self) -> MetricsResponse:
        """
        Compute evaluation metrics by re-training all four classifiers on the
        dataset and comparing them.  Results are cached after first call.
        """
        if self._metrics_cache is not None:
            return self._metrics_cache

        from sklearn.linear_model import LogisticRegression
        from sklearn.tree import DecisionTreeClassifier
        from sklearn.ensemble import RandomForestClassifier
        from sklearn.neighbors import KNeighborsClassifier

        # Load and preprocess data
        df = pd.read_csv(_DATA_PATH)
        if "Student_ID" in df.columns:
            df.drop(columns=["Student_ID"], inplace=True)
        df.drop_duplicates(inplace=True)

        for col in df.columns:
            if df[col].isnull().any():
                if df[col].dtype == "object":
                    df[col] = df[col].fillna(df[col].mode()[0])
                else:
                    df[col] = df[col].fillna(df[col].median())

        # Encode
        label_encoders: Dict[str, LabelEncoder] = {}
        for col in CAT_COLS + [TARGET_COL]:
            le = LabelEncoder()
            df[col] = le.fit_transform(df[col].astype(str))
            label_encoders[col] = le

        X = df[FEATURE_COLUMNS]
        y = df[TARGET_COL]
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y
        )

        MODELS = {
            "Logistic Regression": LogisticRegression(max_iter=1000, random_state=RANDOM_STATE),
            "Decision Tree":       DecisionTreeClassifier(random_state=RANDOM_STATE),
            "Random Forest":       RandomForestClassifier(n_estimators=100, random_state=RANDOM_STATE),
            "KNN":                 KNeighborsClassifier(n_neighbors=5),
        }

        metrics_list: List[ModelMetrics] = []
        best_name  = ""
        best_acc   = 0.0
        _best_y_pred: np.ndarray | None = None

        for name, mdl in MODELS.items():
            mdl.fit(X_train, y_train)
            y_pred    = mdl.predict(X_test)
            train_acc = accuracy_score(y_train, mdl.predict(X_train)) * 100
            test_acc  = accuracy_score(y_test, y_pred) * 100
            prec      = precision_score(y_test, y_pred, average="weighted", zero_division=0) * 100
            rec       = recall_score(y_test, y_pred, average="weighted", zero_division=0) * 100
            f1        = f1_score(y_test, y_pred, average="weighted", zero_division=0) * 100

            metrics_list.append(ModelMetrics(
                model=name,
                training_accuracy=round(train_acc, 2),
                testing_accuracy=round(test_acc, 2),
                precision=round(prec, 2),
                recall=round(rec, 2),
                f1_score=round(f1, 2),
            ))

            if test_acc > best_acc:
                best_acc  = test_acc
                best_name = name
                _best_y_pred = y_pred

        # Confusion matrix + classification report for best model
        if _best_y_pred is None:
            raise ValueError("No best model prediction computed.")

        cm     = confusion_matrix(y_test, _best_y_pred).tolist()
        classes = label_encoders[TARGET_COL].classes_.tolist()
        cr     = classification_report(
            y_test, _best_y_pred, target_names=classes, output_dict=True
        )

        self._metrics_cache = MetricsResponse(
            best_model=best_name,
            best_accuracy=round(best_acc, 2),
            models=metrics_list,
            confusion_matrix=cm,
            classification_report=cr,
        )
        return self._metrics_cache

    def get_feature_importance(self) -> FeatureImportanceResponse:
        """
        Return feature importance from the loaded model if it supports
        feature_importances_ (tree-based models).
        Falls back to returning equal weights for other models.
        """
        if self._fi_cache is not None:
            return self._fi_cache

        if hasattr(self._model, "feature_importances_"):
            importances = self._model.feature_importances_
        elif hasattr(self._model, "coef_"):
            importances = np.abs(self._model.coef_[0])
        else:
            importances = np.ones(len(FEATURE_COLUMNS)) / len(FEATURE_COLUMNS)

        # Normalise to sum to 1
        total = importances.sum()
        if total > 0:
            importances = importances / total

        sorted_items = sorted(
            zip(FEATURE_COLUMNS, importances),
            key=lambda x: x[1],
            reverse=True,
        )

        features = [
            FeatureImportanceItem(
                feature=feat,
                importance=round(float(imp), 4),
                rank=rank + 1,
            )
            for rank, (feat, imp) in enumerate(sorted_items)
        ]

        self._fi_cache = FeatureImportanceResponse(
            model=self._model_name,
            features=features,
        )
        return self._fi_cache
