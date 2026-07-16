"""
AI-Based Student Placement Prediction System
============================================
FastAPI Backend — Main Entry Point (main.py)

Run:
    uvicorn main:app --reload --host 0.0.0.0 --port 8000

API Docs:
    http://localhost:8000/docs   (Swagger UI)
    http://localhost:8000/redoc  (ReDoc)
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.utils.logger import setup_logging
from app.services.predictor import PlacementPredictor
from app.services.data_service import DataService

# ─── Logging setup ─────────────────────────────────────────────────────────────
setup_logging()
logger = logging.getLogger(__name__)


# ─── Lifespan (startup / shutdown events) ──────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load ML artifacts and dataset once on startup; release on shutdown."""
    logger.info("="*60)
    logger.info("  AI Student Placement Prediction API — Starting Up")
    logger.info("="*60)

    # Initialise shared singletons
    app.state.predictor   = PlacementPredictor()
    app.state.data_service = DataService()

    logger.info("ML model and dataset loaded successfully.")
    logger.info("API is ready to accept requests.")
    yield
    logger.info("Shutting down API server.")


# ─── App factory ───────────────────────────────────────────────────────────────
def create_app() -> FastAPI:
    """Build and configure the FastAPI application."""
    application = FastAPI(
        title="AI Student Placement Prediction API",
        description=(
            "Production-ready REST API for predicting student placement outcomes "
            "using machine learning (Random Forest, Decision Tree, Logistic Regression, KNN)."
        ),
        version="2.0.0",
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # ── CORS — allow the React dev server and production domain ──
    application.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",   # Vite dev server
            "http://localhost:3000",   # CRA fallback
            "http://127.0.0.1:5173",
            "*",                       # Allow all for local dev (restrict in production)
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Register API router ──
    application.include_router(router)

    return application


# ─── Application instance ──────────────────────────────────────────────────────
app = create_app()
