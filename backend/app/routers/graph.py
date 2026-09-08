from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services import notebook_service, neo4j_service
from app.routers.auth import get_current_user

router = APIRouter(prefix="/api/notebooks/{notebook_id}/graph", tags=["Graph"])


@router.get("")
async def get_knowledge_graph(
    notebook_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    nb = await notebook_service.get_notebook(db, notebook_id, current_user.id)
    if not nb:
        raise HTTPException(status_code=404, detail="Notebook không tồn tại")
    return await neo4j_service.get_graph_data(notebook_id)
