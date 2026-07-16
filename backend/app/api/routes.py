"""
AI-Based Student Placement Prediction System
============================================
API Routes (app/api/routes.py)

All REST endpoints wired to the Predictor and DataService singletons
that are attached to app.state on startup.

Endpoints:
    GET  /                    Root info
    GET  /health              Health check
    POST /predict             Single student prediction
    POST /batch-predict       Multi-student batch prediction
    GET  /model-info          Model metadata
    GET  /metrics             All model evaluation metrics
    GET  /feature-importance  Feature importance scores
    GET  /dataset-stats       Aggregated dataset statistics
    GET  /correlation         Feature correlation matrix
    GET  /dataset-sample      First N rows of the raw dataset
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException, Query, Request, status
from fastapi.responses import JSONResponse

from app.models.schemas import (
    BatchPredictionResponse,
    BatchStudentInput,
    DatasetStatsResponse,
    FeatureImportanceResponse,
    HealthResponse,
    MetricsResponse,
    ModelInfoResponse,
    PredictionResponse,
    StudentInput,
)

logger    = logging.getLogger(__name__)
router    = APIRouter()


# ══════════════════════════════════════════════════════════════════════════════
# Helper — pull services from request state
# ══════════════════════════════════════════════════════════════════════════════

def _predictor(request: Request) -> PlacementPredictor:
    return getattr(request.app.state, "predictor")


def _data_service(request: Request) -> DataService:
    return getattr(request.app.state, "data_service")


# ══════════════════════════════════════════════════════════════════════════════
# GET /
# ══════════════════════════════════════════════════════════════════════════════
@router.get("/", tags=["Info"])
async def root() -> Dict[str, Any]:
    """Root endpoint — returns API info and available routes."""
    return {
        "name":        "AI Student Placement Prediction API",
        "version":     "2.0.0",
        "description": "Production-ready REST API for ML-based placement prediction.",
        "endpoints": {
            "docs":               "/docs",
            "health":             "/health",
            "predict":            "POST /predict",
            "batch_predict":      "POST /batch-predict",
            "model_info":         "/model-info",
            "metrics":            "/metrics",
            "feature_importance": "/feature-importance",
            "dataset_stats":      "/dataset-stats",
            "correlation":        "/correlation",
            "dataset_sample":     "/dataset-sample",
        },
    }


# ══════════════════════════════════════════════════════════════════════════════
# GET /health
# ══════════════════════════════════════════════════════════════════════════════
@router.get(
    "/health",
    response_model=HealthResponse,
    tags=["Info"],
    summary="API health check",
)
async def health(request: Request) -> HealthResponse:
    """Returns operational status of the API, model, and dataset."""
    predictor    = _predictor(request)
    data_service = _data_service(request)

    return HealthResponse(
        status="healthy",
        message="AI Student Placement Prediction API is running.",
        model_loaded=predictor.is_loaded,
        dataset_loaded=data_service.is_loaded,
        version="2.0.0",
    )


# ══════════════════════════════════════════════════════════════════════════════
# POST /predict
# ══════════════════════════════════════════════════════════════════════════════
@router.post(
    "/predict",
    response_model=PredictionResponse,
    status_code=status.HTTP_200_OK,
    tags=["Prediction"],
    summary="Predict placement for a single student",
)
async def predict(request: Request, student: StudentInput) -> PredictionResponse:
    """
    Run placement prediction for one student.

    **Input fields** (all required):
    - age, gender, degree, branch, cgpa
    - internships, projects, coding_skills, communication_skills
    - aptitude_score, soft_skills, certifications, backlogs

    **Returns:**  prediction label, placement probability, confidence tier.
    """
    try:
        predictor = _predictor(request)
        result    = predictor.predict(student)
        logger.info(
            "Prediction: %s (%.2f%%)  model=%s",
            result.prediction, result.placement_probability, result.model_used
        )
        return result
    except Exception as exc:
        logger.exception("Prediction failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction error: {str(exc)}",
        ) from exc


# ══════════════════════════════════════════════════════════════════════════════
# POST /batch-predict
# ══════════════════════════════════════════════════════════════════════════════
@router.post(
    "/batch-predict",
    response_model=BatchPredictionResponse,
    status_code=status.HTTP_200_OK,
    tags=["Prediction"],
    summary="Batch predict placement for multiple students",
)
async def batch_predict(
    request: Request,
    payload: BatchStudentInput,
) -> BatchPredictionResponse:
    """
    Run placement prediction for a list of students (max 1,000 per request).

    **Returns:** per-student predictions + summary statistics (placement rate, counts).
    """
    try:
        predictor = _predictor(request)
        result    = predictor.batch_predict(payload.students)
        logger.info(
            "Batch prediction: %d students, placement rate %.2f%%",
            result.total, result.placement_rate
        )
        return result
    except Exception as exc:
        logger.exception("Batch prediction failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch prediction error: {str(exc)}",
        ) from exc


# ══════════════════════════════════════════════════════════════════════════════
# GET /model-info
# ══════════════════════════════════════════════════════════════════════════════
@router.get(
    "/model-info",
    response_model=ModelInfoResponse,
    tags=["Model"],
    summary="Retrieve metadata about the loaded ML model",
)
async def model_info(request: Request) -> ModelInfoResponse:
    """Returns model type, feature list, allowed categorical values, and version."""
    try:
        return _predictor(request).get_model_info()
    except Exception as exc:
        logger.exception("model-info failed: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc)) from exc


# ══════════════════════════════════════════════════════════════════════════════
# GET /metrics
# ══════════════════════════════════════════════════════════════════════════════
@router.get(
    "/metrics",
    response_model=MetricsResponse,
    tags=["Model"],
    summary="All model evaluation metrics (accuracy, F1, confusion matrix)",
)
async def metrics(request: Request) -> MetricsResponse:
    """
    Trains all four classifiers on the dataset and returns comparison metrics.
    **Note:** This endpoint is compute-intensive on first call; results are cached thereafter.
    """
    try:
        return _predictor(request).get_metrics()
    except Exception as exc:
        logger.exception("metrics failed: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc)) from exc


# ══════════════════════════════════════════════════════════════════════════════
# GET /feature-importance
# ══════════════════════════════════════════════════════════════════════════════
@router.get(
    "/feature-importance",
    response_model=FeatureImportanceResponse,
    tags=["Model"],
    summary="Feature importance scores from the best model",
)
async def feature_importance(request: Request) -> FeatureImportanceResponse:
    """
    Returns importance (or coefficient magnitude) for each feature.
    Supports tree-based and linear models.
    """
    try:
        return _predictor(request).get_feature_importance()
    except Exception as exc:
        logger.exception("feature-importance failed: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc)) from exc


# ══════════════════════════════════════════════════════════════════════════════
# GET /dataset-stats
# ══════════════════════════════════════════════════════════════════════════════
@router.get(
    "/dataset-stats",
    response_model=DatasetStatsResponse,
    tags=["Dataset"],
    summary="Aggregated dataset statistics for the dashboard",
)
async def dataset_stats(request: Request) -> DatasetStatsResponse:
    """
    Returns total students, placement rate, average metrics, and
    breakdowns by branch, gender, and degree.
    """
    try:
        return _data_service(request).get_stats()
    except Exception as exc:
        logger.exception("dataset-stats failed: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc)) from exc


# ══════════════════════════════════════════════════════════════════════════════
# GET /correlation
# ══════════════════════════════════════════════════════════════════════════════
@router.get(
    "/correlation",
    tags=["Dataset"],
    summary="Feature correlation matrix",
)
async def correlation(request: Request) -> Dict[str, Any]:
    """Returns a numeric feature correlation matrix as column names + data grid."""
    try:
        return _data_service(request).get_correlation()
    except Exception as exc:
        logger.exception("correlation failed: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc)) from exc


# ══════════════════════════════════════════════════════════════════════════════
# GET /dataset-sample
# ══════════════════════════════════════════════════════════════════════════════
@router.get(
    "/dataset-sample",
    tags=["Dataset"],
    summary="Return first N rows of the dataset",
)
async def dataset_sample(
    request: Request,
    n: int = Query(default=50, ge=1, le=500, description="Number of rows to return"),
) -> List[Dict[str, Any]]:
    """Returns the first `n` rows of the raw dataset as a list of objects."""
    try:
        return _data_service(request).get_raw_sample(n)
    except Exception as exc:
        logger.exception("dataset-sample failed: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc)) from exc
