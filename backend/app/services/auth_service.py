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


def create_access_token(user_id: str | None = None, email: str | None = None, *, data: dict | None = None) -> str:
    if data is not None:
        payload = dict(data)
    else:
        if user_id is None:
            raise ValueError("user_id is required")
        payload = {"sub": user_id}
        if email is not None:
            payload["email"] = email

    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    payload["exp"] = expire
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
    if not isinstance(data, dict):
        raise ValueError("Google token không hợp lệ")

    if data.get("email_verified") is not True:
        raise ValueError("Google email chưa được xác thực")

    issuer = data.get("iss")
    valid_issuers = {"https://accounts.google.com", "accounts.google.com"}
    if issuer not in valid_issuers:
        raise ValueError("Google token issuer không hợp lệ")

    aud = data.get("aud")
    if settings.google_client_id:
        if isinstance(aud, list):
            valid_audience = settings.google_client_id in aud
        else:
            valid_audience = aud == settings.google_client_id
        if not valid_audience:
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


async def update_user_profile(
    db: AsyncSession,
    user: User,
    full_name: str | None = None,
    avatar_url: str | None = None,
) -> User:
    if full_name is not None:
        cleaned_name = full_name.strip()
        if not cleaned_name:
            raise ValueError("Họ và tên không được để trống")
        user.full_name = cleaned_name
    if avatar_url is not None:
        user.avatar_url = avatar_url.strip() or None
    await db.commit()
    await db.refresh(user)
    return user


async def change_user_password(
    db: AsyncSession,
    user: User,
    current_password: str | None,
    new_password: str,
) -> None:
    if len(new_password.strip()) < 6:
        raise ValueError("Mật khẩu mới phải có ít nhất 6 ký tự")
    if user.hashed_password:
        if not current_password:
            raise ValueError("Vui lòng nhập mật khẩu hiện tại")
        if not verify_password(current_password, user.hashed_password):
            raise ValueError("Mật khẩu hiện tại không chính xác")
    user.hashed_password = hash_password(new_password.strip())
    await db.commit()


async def get_user_stats(db: AsyncSession, user: User) -> dict:
    from sqlalchemy import func
    from app.models.notebook import Notebook, Source, ChatMessage, ProcessingStatus

    nb_res = await db.execute(
        select(func.count(Notebook.id)).where(Notebook.user_id == user.id)
    )
    notebook_count = int(nb_res.scalar() or 0)

    src_res = await db.execute(
        select(
            func.count(Source.id),
            func.coalesce(func.sum(Source.chunk_count), 0),
        )
        .join(Notebook, Source.notebook_id == Notebook.id)
        .where(Notebook.user_id == user.id)
    )
    src_row = src_res.one()
    source_count = int(src_row[0] or 0)
    total_chunks = int(src_row[1] or 0)

    comp_res = await db.execute(
        select(func.count(Source.id))
        .join(Notebook, Source.notebook_id == Notebook.id)
        .where(
            Notebook.user_id == user.id,
            Source.status == ProcessingStatus.completed,
        )
    )
    completed_source_count = int(comp_res.scalar() or 0)

    msg_res = await db.execute(
        select(func.count(ChatMessage.id))
        .join(Notebook, ChatMessage.notebook_id == Notebook.id)
        .where(Notebook.user_id == user.id)
    )
    chat_message_count = int(msg_res.scalar() or 0)

    return {
        "notebook_count": notebook_count,
        "source_count": source_count,
        "completed_source_count": completed_source_count,
        "total_chunks": total_chunks,
        "chat_message_count": chat_message_count,
        "has_password": bool(user.hashed_password),
    }

