from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.routers import auth, upload, analytics, query  # Add query
from app.routers import ocr_simple as ocr
from app.utils.database import connect_to_mongo, close_mongo_connection

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting AI Synapse OCR API...")
    try:
        await connect_to_mongo()
        logger.info("MongoDB connected successfully")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
    yield
    logger.info("Shutting down...")
    await close_mongo_connection()

app = FastAPI(
    title="AI Synapse OCR",
    description="AI-OCR Based System",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth")
app.include_router(upload.router, prefix="/api/upload")
app.include_router(ocr.router)
app.include_router(query.router)  # Add query router
app.include_router(analytics.router, prefix="/api/analytics")

@app.get("/")
async def root():
    return {"message": "AI Synapse OCR API", "status": "running"}

@app.get("/api/health")
async def health():
    return {"status": "healthy"}