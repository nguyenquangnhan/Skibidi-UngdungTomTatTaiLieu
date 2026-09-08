from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.notebook import NotebookCreate, NotebookResponse
from app.services import notebook_service
from app.routers.auth import get_current_user

router = APIRouter(prefix="/api/notebooks", tags=["Notebooks"])


@router.get("", response_model=list[NotebookResponse])
async def list_notebooks(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    notebooks = await notebook_service.get_notebooks(db, current_user.id)
    result = []
    for nb in notebooks:
        sources = await notebook_service.get_sources(db, nb.id)
        nb_dict = {
            "id": nb.id,
            "title": nb.title,
            "description": nb.description,
            "created_at": nb.created_at,
            "updated_at": nb.updated_at,
            "source_count": len(sources),
        }
        result.append(NotebookResponse(**nb_dict))
    return result


@router.post("", response_model=NotebookResponse, status_code=201)
async def create_notebook(
    body: NotebookCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    nb = await notebook_service.create_notebook(db, current_user.id, body.title, body.description)
    return NotebookResponse(
        id=nb.id, title=nb.title, description=nb.description,
        created_at=nb.created_at, updated_at=nb.updated_at, source_count=0,
    )


@router.delete("/{notebook_id}", status_code=204)
async def delete_notebook(
    notebook_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    deleted = await notebook_service.delete_notebook(db, notebook_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Notebook không tồn tại")
