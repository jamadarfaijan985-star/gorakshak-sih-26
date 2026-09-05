"""
Bovine Mastitis Prediction Backend - Main Application
SIH26109: AI-Based Predictive Modelling for Early Forecasting of Bovine Mastitis in Indian Dairy Farms
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import routes_animals, routes_auth, routes_farms, routes_ingest, routes_risk, routes_alerts
from app.core.config import settings
from app.db.session import init_db, close_db

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage app startup and shutdown."""
    # ------------------------------------------------------------------ #
    # Startup                                                               #
    # ------------------------------------------------------------------ #

    # 1. Database connection
    await init_db()

    # 2. ML model loading — must happen after DB init so any model-warmup
    #    queries (future) can use the live DB connection.
    #    Failures are intentionally non-fatal: the backend degrades to the
    #    rule-based engine rather than refusing to start.
    try:
        from app.services.model_loader import load_all_models  # noqa: PLC0415
        load_all_models()
    except Exception as exc:  # noqa: BLE001
        logger.warning(
            "Model loading raised an unexpected error at startup: %s. "
            "The application will continue using the rule-based fallback engine.",
            exc,
        )

    yield

    # ------------------------------------------------------------------ #
    # Shutdown                                                              #
    # ------------------------------------------------------------------ #
    await close_db()


app = FastAPI(
    title="Bovine Mastitis Prediction Backend",
    description=(
        "AI-based early forecasting system for bovine mastitis in Indian dairy farms. "
        "Uses trained XGBoost classification and forecasting models (gorakshak_cow_clinical_v2, "
        "gorakshak_buffalo_v2, gorakshak_forecast_7d/14d_xgb_v2) with YOLO-based udder image "
        "analysis (YOLOv8 classify for cows, YOLOv8 segment for buffaloes)."
    ),
    version="0.2.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(routes_auth.router)
app.include_router(routes_farms.router)
app.include_router(routes_animals.router)
app.include_router(routes_ingest.router)
app.include_router(routes_risk.router)
app.include_router(routes_alerts.router)


@app.get("/", tags=["root"])
async def read_root():
    """Root endpoint."""
    return {
        "message": "Bovine Mastitis Prediction Backend — SIH26109",
        "version": "0.2.0",
        "docs_url": "/docs",
        "redoc_url": "/redoc",
        "model_status_url": "/api/v1/risk/model-status",
    }


@app.get("/health", tags=["health"])
async def health_check():
    """
    Health check endpoint.

    Includes a snapshot of ML model load status so ops/CI can verify
    that models loaded correctly at startup.
    """
    try:
        from app.services.model_loader import model_status  # noqa: PLC0415
        ml_status = model_status()
        all_ok = all(v.get("status") == "ok" for v in ml_status.values())
    except Exception:  # noqa: BLE001
        ml_status = {}
        all_ok = False

    return {
        "status": "ok",
        "ml_models": {
            "all_loaded": all_ok,
            "detail": ml_status,
        },
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
