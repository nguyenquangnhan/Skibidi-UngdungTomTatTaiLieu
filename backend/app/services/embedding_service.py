"""
Embedding Service
- Split text into chunks using LangChain RecursiveCharacterTextSplitter
- Generate embeddings via Gemini Embedding API
- Store chunks + embeddings to Neo4j
"""
import uuid
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings

from app.config import get_settings
from app.services import neo4j_service

settings = get_settings()

_embedder = None


def get_embedder() -> GoogleGenerativeAIEmbeddings:
    global _embedder
    if _embedder is None:
        _embedder = GoogleGenerativeAIEmbeddings(
            model=settings.embedding_model,
            google_api_key=settings.gemini_api_key_list[0] if settings.gemini_api_key_list else "",
        )
    return _embedder


def split_text(text: str) -> list[str]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
        separators=["\n\n", "\n", ".", " ", ""],
    )
    return splitter.split_text(text)


async def embed_and_store(source_id: str, notebook_id: str, text: str) -> int:
    """Split text → generate embeddings → store to Neo4j. Returns number of chunks."""
    chunks = split_text(text)
    if not chunks:
        return 0

    embeddings = None
    last_error = None
    for key in settings.gemini_api_key_list:
        try:
            embeddings = GoogleGenerativeAIEmbeddings(
                model=settings.embedding_model,
                google_api_key=key,
            ).embed_documents(chunks)
            break
        except Exception as error:
            last_error = error
    if embeddings is None:
        raise RuntimeError("Tất cả Gemini API key đều không thể tạo embedding") from last_error

    chunk_records = []
    for i, (chunk_text, embedding) in enumerate(zip(chunks, embeddings)):
        chunk_records.append({
            "chunk_id": str(uuid.uuid4()),
            "text": chunk_text,
            "source_id": source_id,
            "chunk_index": i,
            "embedding": embedding,
        })

    await neo4j_service.store_chunks(source_id, notebook_id, chunk_records)
    return len(chunk_records)


async def embed_query(query: str) -> list[float]:
    """Embed a single query string."""
    last_error = None
    for key in settings.gemini_api_key_list:
        try:
            return GoogleGenerativeAIEmbeddings(
                model=settings.embedding_model,
                google_api_key=key,
            ).embed_query(query)
        except Exception as error:
            last_error = error
    raise RuntimeError("Tất cả Gemini API key đều không thể tạo query embedding") from last_error
