"""
Unit tests cho Backend FastAPI của Skibidi DocuGraph RAG.
Kiểm tra cấu hình, các router API, schemas Pydantic và logic xử lý.
"""

import pytest
from app.config import settings
from app.schemas.user import UserRegisterRequest, UserLoginRequest
from app.schemas.notebook import NotebookCreate
from app.schemas.chat import ChatMessageRequest
from app.services.auth_service import hash_password, verify_password, create_access_token, decode_access_token


def test_app_settings():
    """Kiểm tra load cấu hình mặc định."""
    assert settings.app_name == "Skibidi"
    assert settings.embedding_dim == 768
    assert settings.chat_model == "gemini-2.5-flash"
    assert settings.chunk_size == 1000


def test_password_hashing():
    """Kiểm tra mã hóa bcrypt và xác thực mật khẩu."""
    password = "SuperSecretPassword123!"
    hashed = hash_password(password)
    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("WrongPassword", hashed) is False


def test_jwt_token_flow():
    """Kiểm tra tạo và giải mã JWT token."""
    user_id = "test-uuid-12345"
    token = create_access_token(data={"sub": user_id})
    assert isinstance(token, str)
    assert len(token) > 20

    payload = decode_access_token(token)
    assert payload is not None
    assert payload.get("sub") == user_id


def test_pydantic_schemas_validation():
    """Kiểm tra tính hợp lệ của dữ liệu đầu vào schemas."""
    # User register
    reg_data = UserRegisterRequest(
        email="testuser@example.com",
        password="ValidPassword123",
        full_name="Nguyễn Văn A"
    )
    assert reg_data.email == "testuser@example.com"

    # User login
    login_data = UserLoginRequest(
        email="testuser@example.com",
        password="ValidPassword123"
    )
    assert login_data.email == "testuser@example.com"

    # Notebook create
    nb_data = NotebookCreate(
        title="Nghiên cứu trí tuệ nhân tạo",
        description="Tổng hợp tài liệu GraphRAG 2026"
    )
    assert nb_data.title == "Nghiên cứu trí tuệ nhân tạo"

    # Chat request
    chat_req = ChatMessageRequest(
        message="Hãy tóm tắt tài liệu chương 1 cho tôi",
        top_k=5
    )
    assert chat_req.message == "Hãy tóm tắt tài liệu chương 1 cho tôi"
    assert chat_req.top_k == 5


def test_document_processor_chunking():
    """Kiểm tra logic chia đoạn văn bản (text chunking)."""
    from app.services.document_processor import split_text_into_chunks

    sample_long_text = "Đây là văn bản thử nghiệm nhằm kiểm tra thuật toán chia nhỏ khối dữ liệu chunking. " * 30
    chunks = split_text_into_chunks(sample_long_text, chunk_size=300, chunk_overlap=50)

    assert len(chunks) > 1
    assert all(len(c) <= 350 for c in chunks)
