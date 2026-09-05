"""
Bovine Mastitis Prediction Backend - Main Application
SIH26109: AI-Based Predictive Modelling for Early Forecasting of Bovine Mastitis in Indian Dairy Farms
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import routes_animals, routes_auth, routes_farms, routes_ingest, routes_risk, routes_alerts
from app.core.config import settings
from app.db.session import init_db, close_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage app startup and shutdown."""
    # Startup
    await init_db()
    yield
    # Shutdown
    await close_db()


app = FastAPI(
    title="Bovine Mastitis Prediction Backend",
    description="AI-based early forecasting system for bovine mastitis in Indian dairy farms",
    version="0.1.0",
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
        "message": "Bovine Mastitis Prediction Backend - SIH26109",
        "docs_url": "/docs",
        "redoc_url": "/redoc",
    }


@app.get("/health", tags=["health"])
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
