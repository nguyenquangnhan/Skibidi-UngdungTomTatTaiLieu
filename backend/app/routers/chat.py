import json
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.chat import ChatRequest, ChatMessageResponse
from app.services import notebook_service, rag_service
from app.routers.auth import get_current_user

router = APIRouter(prefix="/api/notebooks/{notebook_id}/chat", tags=["Chat"])


@router.get("", response_model=list[ChatMessageResponse])
async def get_chat_history(
    notebook_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    nb = await notebook_service.get_notebook(db, notebook_id, current_user.id)
    if not nb:
        raise HTTPException(status_code=404, detail="Notebook không tồn tại")
    return await notebook_service.get_chat_history(db, notebook_id)


@router.post("")
async def chat(
    notebook_id: str,
    body: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    nb = await notebook_service.get_notebook(db, notebook_id, current_user.id)
    if not nb:
        raise HTTPException(status_code=404, detail="Notebook không tồn tại")

    # Save user message
    await notebook_service.save_message(db, notebook_id, "user", body.message)

    # Get history for context
    history = await notebook_service.get_chat_history(db, notebook_id)
    history_dicts = [{"role": m.role, "content": m.content} for m in history[:-1]]  # Exclude the just-saved one

    full_response = ""
    source_ids = []

    async def stream_and_save():
        nonlocal full_response, source_ids
        async for chunk in rag_service.chat_stream(notebook_id, body.message, history_dicts):
            # Parse metadata chunks
            if chunk.startswith("data: "):
                try:
                    data = json.loads(chunk[6:])
                    if data.get("type") == "sources":
                        source_ids = data.get("source_ids", [])
                    elif data.get("type") == "done":
                        full_response = data.get("full_content", "")
                except Exception:
                    pass
            yield chunk

        # Save assistant response after stream ends
        await notebook_service.save_message(
            db, notebook_id, "assistant", full_response,
            sources_used=json.dumps(source_ids) if source_ids else None,
        )

    return StreamingResponse(
        stream_and_save(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
