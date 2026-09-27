import jwt
import bcrypt
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import httpx

from app.config import get_settings
from app.models.user import User

settings = get_settings()


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: str, email: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {"sub": user_id, "email": email, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret_key, algorithm="HS256")


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, settings.jwt_secret_key, algorithms=["HS256"])


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: str) -> User | None:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def register_user(db: AsyncSession, email: str, password: str, full_name: str | None = None) -> User:
    existing = await get_user_by_email(db, email)
    if existing:
        raise ValueError("Email đã được sử dụng")
    user = User(email=email, hashed_password=hash_password(password), full_name=full_name)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def authenticate_user(db: AsyncSession, email: str, password: str) -> User:
    user = await get_user_by_email(db, email)
    if not user or not user.hashed_password:
        raise ValueError("Email hoặc mật khẩu không đúng")
    if not verify_password(password, user.hashed_password):
        raise ValueError("Email hoặc mật khẩu không đúng")
    return user


async def verify_google_token(id_token: str) -> dict:
    """Verify Google ID token and return user info."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://oauth2.googleapis.com/tokeninfo",
            params={"id_token": id_token}
        )
    if resp.status_code != 200:
        raise ValueError("Google token không hợp lệ")
    data = resp.json()
    if settings.google_client_id and data.get("aud") != settings.google_client_id:
        raise ValueError("Google token không khớp client ID")
    return data


async def google_auth(db: AsyncSession, id_token: str) -> User:
    """Authenticate via Google OAuth2 — create or link account."""
    info = await verify_google_token(id_token)
    email = info.get("email")
    if not email:
        raise ValueError("Không lấy được email từ Google token")
    google_id = info.get("sub")
    # Find by google_id first
    result = await db.execute(select(User).where(User.google_id == google_id))
    user = result.scalar_one_or_none()
    if not user:
        # Find by email (link existing account)
        user = await get_user_by_email(db, email)
        if user:
            user.google_id = google_id
            if not user.avatar_url:
                user.avatar_url = info.get("picture")
        else:
            # Create new account
            user = User(
                email=email,
                google_id=google_id,
                full_name=info.get("name"),
                avatar_url=info.get("picture"),
            )
            db.add(user)
    await db.commit()
    await db.refresh(user)
    return user
