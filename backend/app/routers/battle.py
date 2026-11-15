"""
Skibidi — Realtime Multiplayer Quiz Battle Router
Synchronized server-clock quiz rooms with 6-digit PIN codes, speed-bonus scoring, and live leaderboard.
"""
import asyncio
import random
import string
import time
from dataclasses import dataclass, field

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services import quiz_service

router = APIRouter(prefix="/api/battle", tags=["Battle"])

QUESTION_SECONDS = 15
REVEAL_SECONDS = 5
COUNTDOWN_SECONDS = 3
MAX_PLAYERS = 30
ROOM_TTL_SECONDS = 60 * 60 * 3


class CreateRoomRequest(BaseModel):
    host_id: str
    host_name: str
    notebook_id: str
    notebook_title: str | None = None
    num_questions: int = 5


class JoinRoomRequest(BaseModel):
    user_id: str
    user_name: str


class StartRoomRequest(BaseModel):
    user_id: str


class AnswerRequest(BaseModel):
    user_id: str
    question_index: int
    option: str


class LeaveRoomRequest(BaseModel):
    user_id: str


@dataclass
class Player:
    user_id: str
    name: str
    score: int = 0
    correct: int = 0
    total_answer_ms: int = 0
    answers: dict[int, dict] = field(default_factory=dict)


@dataclass
class Room:
    code: str
    host_id: str
    notebook_id: str
    notebook_title: str
    questions: list[dict]
    status: str = "waiting"
    players: dict[str, Player] = field(default_factory=dict)
    created_at: float = field(default_factory=time.time)
    started_at: float | None = None


ROOMS: dict[str, Room] = {}


def _now() -> float:
    return time.time()


def _cleanup_rooms() -> None:
    now = _now()
    expired = [code for code, r in ROOMS.items() if now - r.created_at > ROOM_TTL_SECONDS]
    for code in expired:
        ROOMS.pop(code, None)


def _generate_code() -> str:
    for _ in range(50):
        code = "".join(random.choices(string.digits, k=6))
        if code not in ROOMS:
            return code
    raise HTTPException(status_code=500, detail="Không thể sinh mã phòng, vui lòng thử lại")


def _get_room(code: str) -> Room:
    room = ROOMS.get(code.strip())
    if not room:
        raise HTTPException(status_code=404, detail="Phòng đấu trí không tồn tại hoặc đã bị đóng")
    return room


def _compute_phase(room: Room) -> dict:
    if room.status == "waiting" or room.started_at is None:
        return {"phase": "waiting", "question_index": -1, "phase_ends_at": None}

    now = _now()
    elapsed = now - room.started_at
    if elapsed < COUNTDOWN_SECONDS:
        return {
            "phase": "countdown",
            "question_index": 0,
            "phase_ends_at": room.started_at + COUNTDOWN_SECONDS,
        }

    slot = QUESTION_SECONDS + REVEAL_SECONDS
    in_game = elapsed - COUNTDOWN_SECONDS
    idx = int(in_game // slot)
    if idx >= len(room.questions):
        room.status = "finished"
        return {"phase": "finished", "question_index": len(room.questions) - 1, "phase_ends_at": None}

    slot_start = room.started_at + COUNTDOWN_SECONDS + idx * slot
    offset = in_game - idx * slot
    if offset < QUESTION_SECONDS:
        return {"phase": "question", "question_index": idx, "phase_ends_at": slot_start + QUESTION_SECONDS}
    return {"phase": "reveal", "question_index": idx, "phase_ends_at": slot_start + slot}


def _leaderboard(room: Room) -> list[dict]:
    players = sorted(
        room.players.values(),
        key=lambda p: (-p.score, -p.correct, p.total_answer_ms),
    )
    return [
        {
            "user_id": p.user_id,
            "name": p.name,
            "score": p.score,
            "correct": p.correct,
            "is_host": p.user_id == room.host_id,
            "rank": i + 1,
            "avg_answer_ms": int(p.total_answer_ms / max(1, len(p.answers))),
        }
        for i, p in enumerate(players)
    ]


def _serialize(room: Room, viewer_id: str | None) -> dict:
    phase_info = _compute_phase(room)
    phase = phase_info["phase"]
    idx = phase_info["question_index"]

    question_payload = None
    if phase in ("question", "reveal") and 0 <= idx < len(room.questions):
        q = room.questions[idx]
        question_payload = {
            "index": idx,
            "question": q["question"],
            "options": q["options"],
        }
        if phase == "reveal":
            question_payload["correct_option"] = q["correct_option"]
            question_payload["explanation"] = q.get("explanation") or ""

    viewer = room.players.get(viewer_id or "")
    my_answer = viewer.answers.get(idx) if (viewer and idx >= 0) else None
    answered_count = sum(1 for p in room.players.values() if idx in p.answers) if idx >= 0 else 0

    return {
        "room_code": room.code,
        "host_id": room.host_id,
        "notebook_id": room.notebook_id,
        "notebook_title": room.notebook_title,
        "status": room.status,
        "phase": phase,
        "question_index": idx,
        "total_questions": len(room.questions),
        "question_seconds": QUESTION_SECONDS,
        "reveal_seconds": REVEAL_SECONDS,
        "phase_ends_at": phase_info["phase_ends_at"],
        "server_now": _now(),
        "question": question_payload,
        "my_answer": my_answer,
        "answered_count": answered_count,
        "is_host": viewer_id == room.host_id,
        "is_member": viewer is not None,
        "players": _leaderboard(room),
    }


async def _load_room_questions(
    db: AsyncSession, notebook_id: str, notebook_title: str, num_questions: int
) -> list[dict]:
    try:
        raw_items = await asyncio.wait_for(
            quiz_service.get_or_generate_quiz(
                db, notebook_id, notebook_title, num_questions=num_questions, force_regenerate=False
            ),
            timeout=5.0,
        )
    except Exception:
        raw_items = quiz_service._build_fallback_quiz(notebook_title, [], [], num_questions)

    return [
        {
            "question": item["question"],
            "options": [
                {"key": "A", "text": item["option_a"]},
                {"key": "B", "text": item["option_b"]},
                {"key": "C", "text": item["option_c"]},
                {"key": "D", "text": item["option_d"]},
            ],
            "correct_option": item["correct_option"],
            "explanation": item.get("explanation", ""),
        }
        for item in raw_items[: max(1, num_questions)]
    ]


@router.post("/rooms")
async def create_room(req: CreateRoomRequest, db: AsyncSession = Depends(get_db)):
    _cleanup_rooms()
    if not req.notebook_id.strip():
        raise HTTPException(status_code=400, detail="Vui lòng chọn sổ tay để tạo phòng đấu trí")

    title = req.notebook_title or "Sổ tay học tập"
    questions = await _load_room_questions(db, req.notebook_id, title, req.num_questions)
    code = _generate_code()
    room = Room(
        code=code,
        host_id=req.host_id,
        notebook_id=req.notebook_id,
        notebook_title=title,
        questions=questions,
    )
    room.players[req.host_id] = Player(user_id=req.host_id, name=req.host_name or "Chủ phòng")
    ROOMS[code] = room
    return _serialize(room, req.host_id)


@router.post("/rooms/{room_code}/join")
async def join_room(room_code: str, req: JoinRoomRequest):
    room = _get_room(room_code)
    _compute_phase(room)

    if req.user_id in room.players:
        room.players[req.user_id].name = req.user_name or room.players[req.user_id].name
        return _serialize(room, req.user_id)

    if room.status != "waiting":
        raise HTTPException(status_code=400, detail="Trận đấu đã bắt đầu hoặc kết thúc")
    if len(room.players) >= MAX_PLAYERS:
        raise HTTPException(status_code=400, detail="Phòng đã đủ người chơi")

    room.players[req.user_id] = Player(user_id=req.user_id, name=req.user_name or "Người chơi")
    return _serialize(room, req.user_id)


@router.get("/rooms/{room_code}")
async def get_room_state(room_code: str, user_id: str | None = None):
    room = _get_room(room_code)
    return _serialize(room, user_id)


@router.post("/rooms/{room_code}/start")
async def start_room(room_code: str, req: StartRoomRequest):
    room = _get_room(room_code)
    if req.user_id != room.host_id:
        raise HTTPException(status_code=403, detail="Chỉ chủ phòng mới có quyền bắt đầu trận đấu")
    if room.status != "waiting":
        raise HTTPException(status_code=400, detail="Trận đấu đã được bắt đầu")

    room.status = "playing"
    room.started_at = _now()
    return _serialize(room, req.user_id)


@router.post("/rooms/{room_code}/answer")
async def submit_answer(room_code: str, req: AnswerRequest):
    room = _get_room(room_code)
    player = room.players.get(req.user_id)
    if not player:
        raise HTTPException(status_code=403, detail="Bạn chưa tham gia phòng này")

    phase_info = _compute_phase(room)
    if phase_info["phase"] != "question" or phase_info["question_index"] != req.question_index:
        raise HTTPException(status_code=400, detail="Đã hết thời gian trả lời câu hỏi này")
    if req.question_index in player.answers:
        raise HTTPException(status_code=400, detail="Bạn đã trả lời câu hỏi này rồi")

    q = room.questions[req.question_index]
    option = (req.option or "").strip().upper()[:1]
    remaining = max(0.0, phase_info["phase_ends_at"] - _now())
    answer_ms = int((QUESTION_SECONDS - remaining) * 1000)
    is_correct = option == q["correct_option"]
    points = (100 + int(remaining * 10)) if is_correct else 0

    player.answers[req.question_index] = {
        "option": option,
        "correct": is_correct,
        "points": points,
        "ms": answer_ms,
    }
    player.score += points
    player.correct += 1 if is_correct else 0
    player.total_answer_ms += answer_ms
    return {"status": "ok", "accepted": True, "points": points, "correct": is_correct}


@router.post("/rooms/{room_code}/leave")
async def leave_room(room_code: str, req: LeaveRoomRequest):
    room = ROOMS.get(room_code.strip())
    if not room:
        return {"status": "ok"}
    if req.user_id == room.host_id and room.status == "waiting":
        ROOMS.pop(room.code, None)
        return {"status": "closed"}
    if room.status == "waiting":
        room.players.pop(req.user_id, None)
    return {"status": "ok"}
