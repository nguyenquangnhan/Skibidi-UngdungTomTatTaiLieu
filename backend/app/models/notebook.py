import uuid
from datetime import datetime
from sqlalchemy import String, Text, DateTime, ForeignKey, Enum, func, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum
from app.database import Base


class ProcessingStatus(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"


class SourceType(str, enum.Enum):
    pdf = "pdf"
    image = "image"
    url = "url"


class Notebook(Base):
    __tablename__ = "notebooks"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    sources: Mapped[list["Source"]] = relationship("Source", back_populates="notebook", cascade="all, delete-orphan")
    chat_messages: Mapped[list["ChatMessage"]] = relationship("ChatMessage", back_populates="notebook", cascade="all, delete-orphan")


class Source(Base):
    __tablename__ = "sources"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    notebook_id: Mapped[str] = mapped_column(String(36), ForeignKey("notebooks.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    source_type: Mapped[SourceType] = mapped_column(Enum(SourceType), nullable=False)
    file_path: Mapped[str | None] = mapped_column(String(1024), nullable=True)  # for pdf/image
    url: Mapped[str | None] = mapped_column(Text, nullable=True)  # for URL sources
    status: Mapped[ProcessingStatus] = mapped_column(Enum(ProcessingStatus), default=ProcessingStatus.pending)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    chunk_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    notebook: Mapped["Notebook"] = relationship("Notebook", back_populates="sources")


class MessageRole(str, enum.Enum):
    user = "user"
    assistant = "assistant"


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    notebook_id: Mapped[str] = mapped_column(String(36), ForeignKey("notebooks.id", ondelete="CASCADE"), nullable=False, index=True)
    role: Mapped[MessageRole] = mapped_column(Enum(MessageRole), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    sources_used: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON string of source IDs
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    notebook: Mapped["Notebook"] = relationship("Notebook", back_populates="chat_messages")
