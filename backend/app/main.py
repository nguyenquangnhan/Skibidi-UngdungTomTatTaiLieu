from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import init_db
from app.services.neo4j_service import init_vector_index, close_neo4j_driver
from app.services.notebook_service import resume_pending_sources
from app.routers import auth, notebooks, sources, chat, graph, quiz

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
    await init_db()
    await init_vector_index()
    await resume_pending_sources()
    yield
    # Shutdown
    await close_neo4j_driver()


app = FastAPI(
    title="Skibidi API",
    description="Nền tảng tóm tắt & hỏi đáp tài liệu thông minh với GraphRAG + PP-OCRv6",
    version="0.2.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(notebooks.router)
app.include_router(sources.router)
app.include_router(chat.router)
app.include_router(graph.router)
app.include_router(quiz.router)


@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "Skibidi Backend API đang hoạt động!",
        "version": "0.2.0",
        "docs": "/docs",
        "health": "/api/health",
        "frontend": "http://localhost:3000",
    }


@app.get("/api/health", tags=["Health"])
async def health():
    return {"status": "ok", "version": "0.1.0"}
