from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # Google Gemini
    gemini_api_key: str = ""

    # PostgreSQL
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/notebooklm"

    # Neo4j
    neo4j_uri: str = "bolt://localhost:7687"
    neo4j_username: str = "neo4j"
    neo4j_password: str = "neo4j_password"

    # RAG Settings
    chat_model: str = "gemini-2.5-flash"
    embedding_model: str = "models/gemini-embedding-001"
    chunk_size: int = 1000
    chunk_overlap: int = 200
    rag_top_k: int = 5

    # PaddleOCR
    paddle_ocr_lang: str = "vi"
    paddle_use_gpu: bool = False

    # Auth (JWT)
    jwt_secret_key: str = "change-me-to-a-strong-random-secret-key"
    access_token_expire_minutes: int = 10080  # 7 days

    # Google OAuth2
    google_client_id: str = ""

    # CORS
    cors_origins: str = "http://localhost:3000"

    # File Upload
    upload_dir: str = "./uploads"
    max_upload_size_mb: int = 50

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]


@lru_cache
def get_settings() -> Settings:
    return Settings()
