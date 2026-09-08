from pydantic import BaseModel
from datetime import datetime


class NotebookCreate(BaseModel):
    title: str
    description: str | None = None


class NotebookUpdate(BaseModel):
    title: str | None = None
    description: str | None = None


class NotebookResponse(BaseModel):
    id: str
    title: str
    description: str | None
    created_at: datetime
    updated_at: datetime
    source_count: int = 0

    model_config = {"from_attributes": True}
