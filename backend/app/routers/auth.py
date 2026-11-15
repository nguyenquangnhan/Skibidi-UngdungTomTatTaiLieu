from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
import jwt

from app.database import get_db
from app.schemas.user import (
    UserRegister,
    UserLogin,
    GoogleAuthRequest,
    TokenResponse,
    UserResponse,
    UserProfileUpdate,
    PasswordChangeRequest,
    UserStatsResponse,
)
from app.services import auth_service
from app.config import get_settings

router = APIRouter(prefix="/auth", tags=["Authentication"])
settings = get_settings()


async def get_current_user(
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
):
    token = authorization.removeprefix("Bearer ").strip() if authorization else ""
    if not token:
        raise HTTPException(status_code=401, detail="Token không hợp lệ")
    try:
        payload = auth_service.decode_access_token(token)
        user = await auth_service.get_user_by_id(db, payload["sub"])
        if not user:
            raise HTTPException(status_code=401, detail="Người dùng không tồn tại")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token đã hết hạn")
    except Exception:
        raise HTTPException(status_code=401, detail="Token không hợp lệ")


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(body: UserRegister, db: AsyncSession = Depends(get_db)):
    try:
        user = await auth_service.register_user(db, body.email, body.password, body.full_name)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    token = auth_service.create_access_token(user.id, user.email)
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.post("/login", response_model=TokenResponse)
async def login(body: UserLogin, db: AsyncSession = Depends(get_db)):
    try:
        user = await auth_service.authenticate_user(db, body.email, body.password)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    token = auth_service.create_access_token(user.id, user.email)
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.post("/google", response_model=TokenResponse)
async def google_login(body: GoogleAuthRequest, db: AsyncSession = Depends(get_db)):
    try:
        user = await auth_service.google_auth(db, body.id_token)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    token = auth_service.create_access_token(user.id, user.email)
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.get("/me", response_model=UserResponse)
async def me(current_user=Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.patch("/me", response_model=UserResponse)
async def update_me(
    body: UserProfileUpdate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        updated = await auth_service.update_user_profile(
            db, current_user, full_name=body.full_name, avatar_url=body.avatar_url
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return UserResponse.model_validate(updated)


@router.post("/change-password")
async def change_password(
    body: PasswordChangeRequest,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        await auth_service.change_user_password(
            db, current_user, body.current_password, body.new_password
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"message": "Đổi mật khẩu thành công"}


@router.get("/stats", response_model=UserStatsResponse)
async def user_stats(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stats = await auth_service.get_user_stats(db, current_user)
    return UserStatsResponse(**stats)

