import asyncio
import os
import shutil
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.models.notebook import SourceType
from app.schemas.source import SourceResponse, UrlSourceCreate
from app.services import notebook_service
from app.routers.auth import get_current_user

router = APIRouter(prefix="/api/notebooks/{notebook_id}/sources", tags=["Sources"])
settings = get_settings()

ALLOWED_EXTENSIONS = {
    "pdf": SourceType.pdf,
    "png": SourceType.image,
    "jpg": SourceType.image,
    "jpeg": SourceType.image,
    "webp": SourceType.image,
    "gif": SourceType.image,
    "bmp": SourceType.image,
    "tiff": SourceType.image,
}


@router.get("", response_model=list[SourceResponse])
async def list_sources(
    notebook_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    nb = await notebook_service.get_notebook(db, notebook_id, current_user.id)
    if not nb:
        raise HTTPException(status_code=404, detail="Notebook không tồn tại")
    return await notebook_service.get_sources(db, notebook_id)


@router.post("/upload", response_model=SourceResponse, status_code=201)
async def upload_file(
    notebook_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    nb = await notebook_service.get_notebook(db, notebook_id, current_user.id)
    if not nb:
        raise HTTPException(status_code=404, detail="Notebook không tồn tại")

    ext = (file.filename or "").rsplit(".", 1)[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Định dạng file không được hỗ trợ: .{ext}")

    # Check file size
    content = await file.read()
    if len(content) > settings.max_upload_size_mb * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"File quá lớn (tối đa {settings.max_upload_size_mb}MB)")

    # Save file
    upload_dir = Path(settings.upload_dir) / notebook_id
    upload_dir.mkdir(parents=True, exist_ok=True)

    import uuid
    file_id = str(uuid.uuid4())
    file_path = str(upload_dir / f"{file_id}.{ext}")
    with open(file_path, "wb") as f:
        f.write(content)

    source_type = ALLOWED_EXTENSIONS[ext]
    source = await notebook_service.create_file_source(
        db, notebook_id, file.filename or f"file.{ext}", file_path, source_type
    )

    # Process in background
    asyncio.create_task(notebook_service.process_source_background(db, source))

    return source


@router.post("/url", response_model=SourceResponse, status_code=201)
async def add_url(
    notebook_id: str,
    body: UrlSourceCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    nb = await notebook_service.get_notebook(db, notebook_id, current_user.id)
    if not nb:
        raise HTTPException(status_code=404, detail="Notebook không tồn tại")

    source = await notebook_service.create_url_source(db, notebook_id, body.url, body.title)
    asyncio.create_task(notebook_service.process_source_background(db, source))
    return source


@router.delete("/{source_id}", status_code=204)
async def delete_source(
    notebook_id: str,
    source_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    nb = await notebook_service.get_notebook(db, notebook_id, current_user.id)
    if not nb:
        raise HTTPException(status_code=404, detail="Notebook không tồn tại")
    deleted = await notebook_service.delete_source(db, source_id, notebook_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Source không tồn tại")


@router.get("/{source_id}/file")
async def get_file(
    notebook_id: str,
    source_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    nb = await notebook_service.get_notebook(db, notebook_id, current_user.id)
    if not nb:
        raise HTTPException(status_code=404, detail="Notebook không tồn tại")
    source = await notebook_service.get_source(db, source_id, notebook_id)
    if not source or not source.file_path:
        raise HTTPException(status_code=404, detail="File không tồn tại")
    if not Path(source.file_path).exists():
        raise HTTPException(status_code=404, detail="File không tìm thấy trên server")
    return FileResponse(source.file_path, filename=source.title)
