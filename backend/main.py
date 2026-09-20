import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from prometheus_fastapi_instrumentator import Instrumentator

from core.config import settings
from api.routes import router as api_router
from api.auth import router as auth_router, users_router
from db.database import engine, Base, SessionLocal
from db.seed import seed_initial_data

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create database tables and seed initial data if empty
Base.metadata.create_all(bind=engine)
try:
    with SessionLocal() as db_session:
        seed_initial_data(db_session)
except Exception as e:
    logger.warning(f"Could not auto-seed database: {e}")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for MarketLens",
    version=settings.VERSION
)

# Ensure uploads directory exists and mount static files
uploads_dir = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# Configure CORS dynamically from settings
origins = settings.ALLOWED_ORIGINS.split(",")
if "*" in origins:
    origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api")
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(users_router, prefix="/api/users", tags=["users"])

Instrumentator().instrument(app).expose(app)

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", os.getenv("BACKEND_PORT", "8000")))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)

