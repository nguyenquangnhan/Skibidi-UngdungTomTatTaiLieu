from pydantic import BaseModel
from datetime import datetime
from app.models.notebook import ProcessingStatus, SourceType


class SourceResponse(BaseModel):
    id: str
    notebook_id: str
    title: str
    source_type: SourceType
    url: str | None
    status: ProcessingStatus
    error_message: str | None
    chunk_count: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UrlSourceCreate(BaseModel):
    url: str
    title: str | None = None
