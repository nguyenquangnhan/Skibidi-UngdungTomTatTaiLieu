"""
Skibidi — Study Groups & Zero-Token Resource Sharing Router
Manages group creation (6-char code VKUxxx), PIN join, member sync, activity events, and shared resources.
"""
import random
import string
import time
import uuid
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/groups", tags=["Study Groups"])

AVATAR_COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EC4899", "#06B6D4", "#8B5CF6"]


class CreateStudyGroupReq(BaseModel):
    name: str
    code: str | None = None
    host_id: str
    host_name: str
    host_email: str = "student@skibidi.ai"
    is_private: bool = True


class JoinStudyGroupReq(BaseModel):
    code: str
    user_id: str
    user_name: str
    user_email: str = "student@skibidi.ai"


class AddMemberReq(BaseModel):
    name: str
    email: str


class ShareResourceReq(BaseModel):
    id: str
    title: str
    file_type: str = "PDF"
    num_pages: int = 1
    uploaded_by: str
    summary_tldr: str | None = None
    summary_detailed: str | None = None
    created_at: str | None = None


LIVE_GROUPS: dict[str, dict] = {}


def _generate_code() -> str:
    for _ in range(50):
        code = "VKU" + "".join(random.choices(string.ascii_uppercase + string.digits, k=3))
        if code not in LIVE_GROUPS:
            return code
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=6))


@router.get("")
async def list_user_groups(user_id: str | None = None):
    results = []
    for g in LIVE_GROUPS.values():
        if not user_id or any(m["id"] == user_id for m in g["members"]):
            results.append(g)
    results.sort(key=lambda x: x.get("updated_at", 0), reverse=True)
    return results


@router.get("/{code}")
async def get_group_by_code(code: str):
    clean_code = code.strip().upper()
    group = LIVE_GROUPS.get(clean_code)
    if not group:
        raise HTTPException(status_code=404, detail="Không tìm thấy nhóm học tập này")
    return group


@router.post("")
async def create_group(req: CreateStudyGroupReq):
    code = (req.code or _generate_code()).strip().upper()
    now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    group = {
        "id": f"grp_{code}_{int(time.time())}",
        "name": req.name.strip() or f"Nhóm Học Tập ({code})",
        "code": code,
        "isPrivate": req.is_private,
        "updated_at": time.time(),
        "last_event": {
            "id": str(uuid.uuid4()),
            "type": "created",
            "actor_id": req.host_id,
            "actor_name": req.host_name,
            "message": f"{req.host_name} đã khởi tạo nhóm {code}",
            "timestamp": time.time(),
        },
        "members": [
            {
                "id": req.host_id,
                "name": req.host_name,
                "email": req.host_email,
                "role": "Trưởng nhóm",
                "color": "#4F46E5",
                "joined_at": now_iso,
            }
        ],
        "resources": [],
    }
    LIVE_GROUPS[code] = group
    return group


@router.post("/join")
async def join_group(req: JoinStudyGroupReq):
    code = req.code.strip().upper()
    if not code:
        raise HTTPException(status_code=400, detail="Mã nhóm không hợp lệ")

    now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    group = LIVE_GROUPS.get(code)
    if not group:
        group = {
            "id": f"grp_{code}",
            "name": f"Nhóm Học Tập ({code})",
            "code": code,
            "isPrivate": True,
            "updated_at": time.time(),
            "last_event": None,
            "members": [],
            "resources": [],
        }
        LIVE_GROUPS[code] = group

    existing = next((m for m in group["members"] if m["id"] == req.user_id), None)
    if existing:
        existing["name"] = req.user_name or existing["name"]
        existing["email"] = req.user_email or existing["email"]
    else:
        role = "Trưởng nhóm" if len(group["members"]) == 0 else "Thành viên"
        color = AVATAR_COLORS[len(group["members"]) % len(AVATAR_COLORS)]
        group["members"].append(
            {
                "id": req.user_id,
                "name": req.user_name,
                "email": req.user_email,
                "role": role,
                "color": color,
                "joined_at": now_iso,
            }
        )
        group["updated_at"] = time.time()
        group["last_event"] = {
            "id": str(uuid.uuid4()),
            "type": "member_joined",
            "actor_id": req.user_id,
            "actor_name": req.user_name,
            "message": f"🎉 {req.user_name} vừa tham gia vào nhóm {group['name']}!",
            "timestamp": time.time(),
        }

    return group


@router.post("/{code}/resources")
async def share_resource_to_group(code: str, req: ShareResourceReq):
    clean_code = code.strip().upper()
    group = LIVE_GROUPS.get(clean_code)
    if not group:
        raise HTTPException(status_code=404, detail="Nhóm không tồn tại")

    if not any(r["id"] == req.id for r in group["resources"]):
        group["resources"].insert(
            0,
            {
                "id": req.id,
                "title": req.title,
                "fileType": req.file_type,
                "numPages": req.num_pages,
                "uploadedBy": req.uploaded_by,
                "summaryTldr": req.summary_tldr,
                "summaryDetailed": req.summary_detailed,
                "createdAt": req.created_at or time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            },
        )
        group["updated_at"] = time.time()
        group["last_event"] = {
            "id": str(uuid.uuid4()),
            "type": "resource_shared",
            "actor_id": req.uploaded_by,
            "actor_name": req.uploaded_by,
            "message": f"📚 {req.uploaded_by} vừa chia sẻ tài liệu \"{req.title}\" (Zero-Token) vào nhóm!",
            "timestamp": time.time(),
        }
    return group


@router.delete("/{code}")
async def delete_group_by_code(code: str):
    clean_code = code.strip().upper()
    LIVE_GROUPS.pop(clean_code, None)
    return {"status": "deleted", "code": clean_code}
