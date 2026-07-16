"""
AI-Based Student Placement Prediction System
============================================
Pydantic Schemas (app/models/schemas.py)

Defines all request and response data models with full validation.
Every field includes description, constraints, and example values.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_validator


# ══════════════════════════════════════════════════════════════════════════════
# ENUMS / ALLOWED VALUES
# ══════════════════════════════════════════════════════════════════════════════

ALLOWED_GENDERS = ["Male", "Female"]
ALLOWED_DEGREES = ["B.Tech", "B.E.", "B.Sc", "BCA", "MCA"]
ALLOWED_BRANCHES = ["CSE", "ECE", "ME", "Civil", "IT"]


# ══════════════════════════════════════════════════════════════════════════════
# REQUEST SCHEMAS
# ══════════════════════════════════════════════════════════════════════════════

class StudentInput(BaseModel):
    """
    Validated input schema for a single student placement prediction.
    All fields mirror the dataset columns used during model training.
    """

    age: int = Field(
        ...,
        ge=18, le=35,
        description="Student age (18–35)",
        examples=[21],
    )
    gender: str = Field(
        ...,
        description="Gender: Male or Female",
        examples=["Male"],
    )
    degree: str = Field(
        ...,
        description="Degree type: B.Tech / B.E. / B.Sc / BCA / MCA",
        examples=["B.Tech"],
    )
    branch: str = Field(
        ...,
        description="Engineering branch: CSE / ECE / ME / Civil / IT",
        examples=["CSE"],
    )
    cgpa: float = Field(
        ...,
        ge=4.0, le=10.0,
        description="Cumulative GPA on a 10-point scale (4.0–10.0)",
        examples=[8.5],
    )
    internships: int = Field(
        ...,
        ge=0, le=10,
        description="Number of internships completed (0–10)",
        examples=[2],
    )
    projects: int = Field(
        ...,
        ge=0, le=20,
        description="Number of projects completed (0–20)",
        examples=[3],
    )
    coding_skills: int = Field(
        ...,
        ge=1, le=10,
        description="Self-rated coding ability on a 1–10 scale",
        examples=[7],
    )
    communication_skills: int = Field(
        ...,
        ge=1, le=10,
        description="Self-rated communication skills on a 1–10 scale",
        examples=[8],
    )
    aptitude_score: int = Field(
        ...,
        ge=0, le=100,
        description="Aptitude test percentage score (0–100)",
        examples=[75],
    )
    soft_skills: int = Field(
        ...,
        ge=1, le=10,
        description="Soft skills rating on a 1–10 scale",
        examples=[7],
    )
    certifications: int = Field(
        ...,
        ge=0, le=10,
        description="Number of professional certifications (0–10)",
        examples=[2],
    )
    backlogs: int = Field(
        ...,
        ge=0, le=10,
        description="Number of active academic backlogs (0–10)",
        examples=[0],
    )

    # ── Validators ─────────────────────────────────────────────────────────────
    @field_validator("gender")
    @classmethod
    def validate_gender(cls, v: str) -> str:
        if v not in ALLOWED_GENDERS:
            raise ValueError(f"gender must be one of {ALLOWED_GENDERS}")
        return v

    @field_validator("degree")
    @classmethod
    def validate_degree(cls, v: str) -> str:
        if v not in ALLOWED_DEGREES:
            raise ValueError(f"degree must be one of {ALLOWED_DEGREES}")
        return v

    @field_validator("branch")
    @classmethod
    def validate_branch(cls, v: str) -> str:
        if v not in ALLOWED_BRANCHES:
            raise ValueError(f"branch must be one of {ALLOWED_BRANCHES}")
        return v

    model_config = {
        "json_schema_extra": {
            "example": {
                "age": 21,
                "gender": "Male",
                "degree": "B.Tech",
                "branch": "CSE",
                "cgpa": 8.5,
                "internships": 2,
                "projects": 3,
                "coding_skills": 7,
                "communication_skills": 8,
                "aptitude_score": 75,
                "soft_skills": 7,
                "certifications": 2,
                "backlogs": 0,
            }
        }
    }


class BatchStudentInput(BaseModel):
    """Wrapper for batch prediction — accepts a list of StudentInput objects."""
    students: List[StudentInput] = Field(
        ...,
        description="List of student records to predict (max 1000)",
        min_length=1,
        max_length=1000,
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "students": [
                    {
                        "age": 21, "gender": "Male", "degree": "B.Tech",
                        "branch": "CSE", "cgpa": 8.5, "internships": 2,
                        "projects": 3, "coding_skills": 7,
                        "communication_skills": 8, "aptitude_score": 75,
                        "soft_skills": 7, "certifications": 2, "backlogs": 0,
                    },
                    {
                        "age": 22, "gender": "Female", "degree": "B.Sc",
                        "branch": "IT", "cgpa": 6.2, "internships": 0,
                        "projects": 1, "coding_skills": 4,
                        "communication_skills": 5, "aptitude_score": 45,
                        "soft_skills": 5, "certifications": 1, "backlogs": 2,
                    },
                ]
            }
        }
    }


# ══════════════════════════════════════════════════════════════════════════════
# RESPONSE SCHEMAS
# ══════════════════════════════════════════════════════════════════════════════

class PredictionResponse(BaseModel):
    """Response for a single placement prediction."""
    prediction: str = Field(..., description="'Placed' or 'Not Placed'")
    placement_probability: float = Field(..., description="Probability of being placed (0–100)")
    not_placed_probability: float = Field(..., description="Probability of NOT being placed (0–100)")
    model_used: str = Field(..., description="Name of the ML model that produced this result")
    confidence: str = Field(..., description="Confidence tier: High / Medium / Low")
    input_summary: Dict[str, Any] = Field(..., description="Echo of the validated input data")


class BatchPredictionItem(BaseModel):
    """Single row in a batch prediction response."""
    index: int
    prediction: str
    placement_probability: float
    not_placed_probability: float
    confidence: str


class BatchPredictionResponse(BaseModel):
    """Response for batch prediction endpoint."""
    total: int
    placed_count: int
    not_placed_count: int
    placement_rate: float
    model_used: str
    predictions: List[BatchPredictionItem]


class ModelInfoResponse(BaseModel):
    """Metadata about the loaded model and training pipeline."""
    model_type: str
    model_name: str
    features: List[str]
    feature_count: int
    target_classes: List[str]
    allowed_genders: List[str]
    allowed_degrees: List[str]
    allowed_branches: List[str]
    version: str


class ModelMetrics(BaseModel):
    """Per-model evaluation metrics."""
    model: str
    training_accuracy: float
    testing_accuracy: float
    precision: float
    recall: float
    f1_score: float


class MetricsResponse(BaseModel):
    """All model metrics plus best model info."""
    best_model: str
    best_accuracy: float
    models: List[ModelMetrics]
    confusion_matrix: List[List[int]]
    classification_report: Dict[str, Any]


class FeatureImportanceItem(BaseModel):
    """Single feature importance entry."""
    feature: str
    importance: float
    rank: int


class FeatureImportanceResponse(BaseModel):
    """Feature importance for tree-based models."""
    model: str
    features: List[FeatureImportanceItem]


class DatasetStatsResponse(BaseModel):
    """Aggregated dataset statistics for the dashboard."""
    total_students: int
    placed_count: int
    not_placed_count: int
    placement_rate: float
    average_cgpa: float
    average_internships: float
    average_projects: float
    average_aptitude: float
    placement_by_branch: Dict[str, Dict[str, int]]
    placement_by_gender: Dict[str, Dict[str, int]]
    placement_by_degree: Dict[str, Dict[str, int]]
    cgpa_distribution: List[Dict[str, Any]]


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    message: str
    model_loaded: bool
    dataset_loaded: bool
    version: str
