"""
Notebook Service — Business logic for notebooks and sources.
Handles async document processing pipeline after upload.
"""
import asyncio
import os
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.config import get_settings
from app.models.notebook import Notebook, Source, ChatMessage, ProcessingStatus, SourceType
from app.services import document_processor, embedding_service, neo4j_service

settings = get_settings()


# ─── Notebook CRUD ────────────────────────────────────────────────────────────

async def get_notebooks(db: AsyncSession, user_id: str) -> list[Notebook]:
    result = await db.execute(
        select(Notebook).where(Notebook.user_id == user_id).order_by(Notebook.updated_at.desc())
    )
    return result.scalars().all()


async def create_notebook(db: AsyncSession, user_id: str, title: str, description: str | None = None) -> Notebook:
    nb = Notebook(user_id=user_id, title=title, description=description)
    db.add(nb)
    await db.commit()
    await db.refresh(nb)
    return nb


async def get_notebook(db: AsyncSession, notebook_id: str, user_id: str) -> Notebook | None:
    result = await db.execute(
        select(Notebook).where(Notebook.id == notebook_id, Notebook.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def delete_notebook(db: AsyncSession, notebook_id: str, user_id: str) -> bool:
    nb = await get_notebook(db, notebook_id, user_id)
    if not nb:
        return False
    # Clean Neo4j data for all sources
    sources_result = await db.execute(select(Source).where(Source.notebook_id == notebook_id))
    for source in sources_result.scalars().all():
        await neo4j_service.delete_source_data(source.id)
        if source.file_path and Path(source.file_path).exists():
            os.remove(source.file_path)
    await db.delete(nb)
    await db.commit()
    return True


# ─── Source Management ────────────────────────────────────────────────────────

async def get_sources(db: AsyncSession, notebook_id: str) -> list[Source]:
    result = await db.execute(
        select(Source).where(Source.notebook_id == notebook_id).order_by(Source.created_at.desc())
    )
    return result.scalars().all()


async def get_source(db: AsyncSession, source_id: str, notebook_id: str) -> Source | None:
    result = await db.execute(
        select(Source).where(Source.id == source_id, Source.notebook_id == notebook_id)
    )
    return result.scalar_one_or_none()


async def delete_source(db: AsyncSession, source_id: str, notebook_id: str) -> bool:
    source = await get_source(db, source_id, notebook_id)
    if not source:
        return False
    await neo4j_service.delete_source_data(source_id)
    if source.file_path and Path(source.file_path).exists():
        os.remove(source.file_path)
    await db.delete(source)
    await db.commit()
    return True


async def create_file_source(
    db: AsyncSession,
    notebook_id: str,
    title: str,
    file_path: str,
    source_type: SourceType,
) -> Source:
    source = Source(
        notebook_id=notebook_id,
        title=title,
        source_type=source_type,
        file_path=file_path,
        status=ProcessingStatus.pending,
    )
    db.add(source)
    await db.commit()
    await db.refresh(source)
    return source


async def create_url_source(db: AsyncSession, notebook_id: str, url: str, title: str | None = None) -> Source:
    source = Source(
        notebook_id=notebook_id,
        title=title or url,
        source_type=SourceType.url,
        url=url,
        status=ProcessingStatus.pending,
    )
    db.add(source)
    await db.commit()
    await db.refresh(source)
    return source


async def process_source_background(db: AsyncSession, source: Source):
    """Run document processing pipeline asynchronously."""
    # Mark as processing
    source.status = ProcessingStatus.processing
    await db.commit()

    try:
        # Extract text
        if source.source_type == SourceType.url:
            title, text = await document_processor.extract_text_from_url(source.url)
            if not source.title or source.title == source.url:
                source.title = title
        else:
            text = await document_processor.process_document(source.file_path, source.source_type.value)

        if not text.strip():
            raise ValueError("Không trích xuất được nội dung từ tài liệu")

        # Embed and store chunks
        nb_id = source.notebook_id
        chunk_count = await embedding_service.embed_and_store(source.id, nb_id, text)

        # Extract Knowledge Graph (background, don't block)
        asyncio.create_task(neo4j_service.extract_and_store_knowledge_graph(source.id, text))

        source.status = ProcessingStatus.completed
        source.chunk_count = chunk_count
    except Exception as e:
        source.status = ProcessingStatus.failed
        source.error_message = str(e)

    await db.commit()


# ─── Chat History ─────────────────────────────────────────────────────────────

async def get_chat_history(db: AsyncSession, notebook_id: str) -> list[ChatMessage]:
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.notebook_id == notebook_id)
        .order_by(ChatMessage.created_at.asc())
    )
    return result.scalars().all()


async def save_message(db: AsyncSession, notebook_id: str, role: str, content: str, sources_used: str | None = None) -> ChatMessage:
    msg = ChatMessage(notebook_id=notebook_id, role=role, content=content, sources_used=sources_used)
    db.add(msg)
    await db.commit()
    await db.refresh(msg)
    return msg
