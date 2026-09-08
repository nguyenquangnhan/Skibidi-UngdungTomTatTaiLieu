from pydantic import BaseModel
from datetime import datetime
from app.models.notebook import MessageRole


class ChatRequest(BaseModel):
    message: str


class ChatMessageResponse(BaseModel):
    id: str
    role: MessageRole
    content: str
    sources_used: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
