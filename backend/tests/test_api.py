"""
Comprehensive test suite for Skibidi DocuGraph RAG Internal Functions (Chapter 5).
Validates:
- 5.6.1 Singleton Pattern: Settings & configuration
- 5.6.2 Repository & Domain Models: User, Notebook, Source, ChatMessage
- 5.6.3 Strategy Pattern: Document processor & text chunking
- 5.6.5 Facade Pattern: RAG context builder (_build_context)
- Security & Auth: Password hashing (Bcrypt) & JWT lifecycle
- Data Contracts: Pydantic schemas validation
- API Presentation Layer: FastAPI routers & error handling
"""

import pytest
from datetime import datetime, timezone
import jwt
from fastapi.testclient import TestClient

from app.config import get_settings, settings
from app.schemas.user import UserRegister, UserLogin, UserResponse, TokenResponse
from app.schemas.notebook import NotebookCreate, NotebookResponse
from app.schemas.chat import ChatRequest, ChatMessageResponse
from app.models.user import User
from app.models.notebook import SourceType, ProcessingStatus, MessageRole, Notebook, Source, ChatMessage
from app.services.auth_service import hash_password, verify_password, create_access_token, decode_access_token
from app.services.document_processor import split_text_into_chunks
from app.services.rag_service import _build_context
from app.main import app


# ==============================================================================
# 1. Architecture 5.6.1: Singleton Pattern & Settings Tests
# ==============================================================================
def test_app_settings_singleton():
    """Kiểm tra tính toàn vẹn và Singleton của cấu hình Settings."""
    s1 = get_settings()
    s2 = get_settings()
    assert s1 is s2, "get_settings() phải tuân thủ Singleton (lru_cache)"
    assert settings.app_name == "Skibidi"
    assert settings.embedding_dim == 768
    assert settings.chat_model == "gemini-2.5-flash"
    assert settings.chunk_size == 1000
    assert settings.chunk_overlap == 200
    assert settings.access_token_expire_minutes == 10080


def test_cors_and_gemini_key_properties():
    """Kiểm tra các properties phụ trợ trong settings."""
    assert isinstance(settings.cors_origins_list, list)
    assert len(settings.cors_origins_list) >= 1
    assert isinstance(settings.gemini_api_key_list, list)


# ==============================================================================
# 2. Security & Authentication: Bcrypt & JWT Tests
# ==============================================================================
def test_password_hashing_and_verification():
    """Kiểm tra mã hóa bcrypt và độ an toàn của mật khẩu."""
    password = "SuperSecretPassword123!"
    hashed = hash_password(password)

    assert hashed != password
    assert hashed.startswith("$2b$") or hashed.startswith("$2a$")
    assert verify_password(password, hashed) is True
    assert verify_password("WrongPassword123!", hashed) is False
    assert verify_password("", hashed) is False


def test_jwt_token_flow():
    """Kiểm tra tạo, ký và giải mã JWT access token."""
    user_id = "test-uuid-12345"
    user_email = "tester@skibidi.edu.vn"

    token = create_access_token(user_id=user_id, email=user_email)
    assert isinstance(token, str)
    assert len(token) > 20

    payload = decode_access_token(token)
    assert payload is not None
    assert payload.get("sub") == user_id
    assert payload.get("email") == user_email
    assert "exp" in payload


def test_jwt_invalid_or_tampered_token():
    """Kiểm tra xử lý khi JWT token bị giả mạo hoặc sai chữ ký."""
    tampered_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.tampered_signature"
    with pytest.raises(jwt.PyJWTError):
        decode_access_token(tampered_token)


# ==============================================================================
# 3. Data Contracts: Pydantic Schemas Validation
# ==============================================================================
def test_user_schemas_validation():
    """Kiểm tra tính hợp lệ của UserRegister và UserLogin schemas."""
    # Hợp lệ
    reg = UserRegister(
        email="testuser@example.com",
        password="ValidPassword123",
        full_name="Nguyễn Văn A"
    )
    assert reg.email == "testuser@example.com"
    assert reg.full_name == "Nguyễn Văn A"

    login = UserLogin(
        email="testuser@example.com",
        password="ValidPassword123"
    )
    assert login.email == "testuser@example.com"

    # Không hợp lệ: email sai định dạng
    with pytest.raises(Exception):
        UserRegister(email="not-an-email", password="123")


def test_notebook_and_chat_schemas():
    """Kiểm tra NotebookCreate và ChatRequest schemas."""
    nb = NotebookCreate(
        title="Tài liệu Trí tuệ Nhân tạo",
        description="Nghiên cứu GraphRAG cho sinh viên K16"
    )
    assert nb.title == "Tài liệu Trí tuệ Nhân tạo"

    chat = ChatRequest(message="Tóm tắt nội dung chương 5")
    assert chat.message == "Tóm tắt nội dung chương 5"


# ==============================================================================
# 4. Architecture 5.6.3: Strategy Pattern — Document Text Chunking
# ==============================================================================
def test_document_processor_chunking():
    """Kiểm tra thuật toán phân mảnh văn bản với RecursiveCharacterTextSplitter."""
    sample_text = (
        "Chương 5 trình bày kiến trúc phân tầng Layered kết hợp Event-Driven. "
        "Pipeline trích xuất tài liệu hỗ trợ PDF text-layer và OCR song song. "
    ) * 20

    chunks = split_text_into_chunks(sample_text, chunk_size=200, chunk_overlap=40)
    assert len(chunks) > 1
    assert all(isinstance(c, str) for c in chunks)
    assert all(len(c) > 0 for c in chunks)


def test_document_processor_empty_text():
    """Kiểm tra xử lý phân mảnh với chuỗi rỗng."""
    chunks = split_text_into_chunks("", chunk_size=200, chunk_overlap=40)
    assert chunks == []


# ==============================================================================
# 5. Architecture 5.6.5: Facade Pattern — RAG Context Builder
# ==============================================================================
def test_rag_facade_build_context():
    """Kiểm tra hàm Facade _build_context hợp nhất Vector Chunks và KG Triples."""
    chunks = [
        {"text": "FastAPI là framework ASGI tốc độ cao."},
        {"text": "Neo4j lưu trữ cấu trúc đồ thị tri thức."}
    ]
    entities = [
        {"entity": "FastAPI", "relation": "SỬ_DỤNG", "target": "ASGI"},
        {"entity": "FastAPI", "relation": "SỬ_DỤNG", "target": "ASGI"},  # Trùng lặp
        {"entity": "Neo4j", "relation": "LƯU_TRỮ", "target": "Tri thức"}
    ]

    context = _build_context(chunks, entities)

    # Đảm bảo có đủ 2 phần
    assert "=== Đoạn văn bản liên quan ===" in context
    assert "[1] FastAPI là framework ASGI tốc độ cao." in context
    assert "[2] Neo4j lưu trữ cấu trúc đồ thị tri thức." in context

    assert "=== Thông tin từ Đồ thị Tri thức ===" in context
    assert "FastAPI —[SỬ_DỤNG]→ ASGI" in context
    assert "Neo4j —[LƯU_TRỮ]→ Tri thức" in context

    # Kiểm tra loại bỏ bộ ba quan hệ (triples) trùng lặp
    assert context.count("FastAPI —[SỬ_DỤNG]→ ASGI") == 1


def test_rag_facade_empty_inputs():
    """Kiểm tra _build_context khi không có chunk hoặc entity nào."""
    context = _build_context([], [])
    assert context == ""


# ==============================================================================
# 6. Domain Model & Enumerations (Section 5.3)
# ==============================================================================
def test_domain_enums():
    """Kiểm tra các Enum miền nghiệp vụ chuẩn xác theo đặc tả UML."""
    assert SourceType.pdf == "pdf"
    assert SourceType.image == "image"
    assert SourceType.url == "url"

    assert ProcessingStatus.pending == "pending"
    assert ProcessingStatus.processing == "processing"
    assert ProcessingStatus.completed == "completed"
    assert ProcessingStatus.failed == "failed"

    assert MessageRole.user == "user"
    assert MessageRole.assistant == "assistant"


def test_domain_model_instantiation():
    """Kiểm tra khả năng khởi tạo ORM entity."""
    user = User(
        id="usr-001",
        email="test@example.com",
        hashed_password="hashed_pwd",
        full_name="Nguyễn Văn Test"
    )
    assert user.id == "usr-001"
    assert user.email == "test@example.com"

    notebook = Notebook(
        id="nb-001",
        user_id=user.id,
        title="Notebook Kiến trúc",
        description="Đặc tả chương 5"
    )
    assert notebook.user_id == user.id


# ==============================================================================
# 7. Presentation Layer: FastAPI Routes TestClient
# ==============================================================================
def test_fastapi_openapi_and_docs():
    """Kiểm tra API Gateway sinh schema OpenAPI và Swagger UI chính xác."""
    client = TestClient(app)
    response = client.get("/docs")
    assert response.status_code == 200

    openapi_response = client.get("/openapi.json")
    assert openapi_response.status_code == 200
    schema = openapi_response.json()
    assert schema["info"]["title"] == "Skibidi API"


def test_unauthorized_access_to_protected_routes():
    """Kiểm tra tính bảo mật: từ chối truy cập 401/403 khi chưa có token JWT."""
    client = TestClient(app)
    response = client.get("/api/notebooks")
    # Phải bị chặn do thiếu Authorization Bearer header
    assert response.status_code in [401, 403]
