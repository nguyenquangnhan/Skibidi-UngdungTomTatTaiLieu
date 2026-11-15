from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.routers.auth import get_current_user
from app.schemas.quiz import QuizGenerateRequest, QuizResponse
from app.services import notebook_service, quiz_service

router = APIRouter(prefix="/api/notebooks/{notebook_id}/quiz", tags=["Quiz"])


@router.get("", response_model=QuizResponse)
async def get_notebook_quiz(
    notebook_id: str,
    num_questions: int = 5,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get or auto-generate multiple-choice quiz questions for a notebook."""
    nb = await notebook_service.get_notebook(db, notebook_id, current_user.id)
    if not nb:
        raise HTTPException(status_code=404, detail="Notebook không tồn tại")

    questions = await quiz_service.get_or_generate_quiz(
        db, notebook_id, nb.title, num_questions=num_questions, force_regenerate=False
    )
    return QuizResponse(notebook_id=notebook_id, title=nb.title, questions=questions)


@router.post("/generate", response_model=QuizResponse)
async def generate_notebook_quiz(
    notebook_id: str,
    body: QuizGenerateRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Force-generate a new set of AI quiz questions for a notebook."""
    nb = await notebook_service.get_notebook(db, notebook_id, current_user.id)
    if not nb:
        raise HTTPException(status_code=404, detail="Notebook không tồn tại")

    questions = await quiz_service.get_or_generate_quiz(
        db,
        notebook_id,
        nb.title,
        num_questions=body.num_questions,
        force_regenerate=body.force_regenerate,
    )
    return QuizResponse(notebook_id=notebook_id, title=nb.title, questions=questions)
