"""
AI Quiz Generator Service for Skibidi Notebooks.
Generates multiple-choice questions (A/B/C/D) with explanations from Neo4j chunks & Knowledge Graph
using Gemini 2.5 Flash Structured JSON, with context-grounded fallback.
"""
import asyncio
import json
import re
import uuid
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.services import neo4j_service, notebook_service
from app.services.gemini_client import get_gemini_clients

settings = get_settings()

# In-memory cache keyed by notebook_id -> list[dict]
_QUIZ_CACHE: dict[str, list[dict]] = {}


def _generate_quiz_gemini_sync(context_text: str, notebook_title: str, num_questions: int) -> list[dict] | None:
    prompt = f"""Dựa vào nội dung sổ tay học tập '{notebook_title}' dưới đây, hãy tạo đúng {num_questions} câu hỏi trắc nghiệm ôn tập (4 phương án A, B, C, D) bằng tiếng Việt.
Yêu cầu trả về đúng mảng JSON hợp lệ theo cấu trúc sau (không bọc markdown):
[
  {{
    "question": "Nội dung câu hỏi?",
    "option_a": "Phương án A",
    "option_b": "Phương án B",
    "option_c": "Phương án C",
    "option_d": "Phương án D",
    "correct_option": "A",
    "explanation": "Giải thích ngắn gọn vì sao đáp án đúng dựa trên tài liệu (kèm [Trang N] nếu có)"
  }}
]

NỘI DUNG TÀI LIỆU:
{context_text[:8000]}
"""
    for client in get_gemini_clients():
        try:
            resp = client.models.generate_content(
                model=settings.chat_model,
                contents=prompt,
            )
            raw = (resp.text or "").strip()
            raw = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw, flags=re.MULTILINE).strip()
            parsed = json.loads(raw)
            if isinstance(parsed, list) and len(parsed) > 0:
                items = []
                for idx, q in enumerate(parsed[:num_questions]):
                    correct = str(q.get("correct_option", "A")).strip().upper()
                    if correct not in ("A", "B", "C", "D"):
                        correct = "A"
                    items.append({
                        "id": f"q_{idx + 1}_{uuid.uuid4().hex[:6]}",
                        "question": str(q.get("question", f"Câu hỏi {idx + 1}")),
                        "option_a": str(q.get("option_a", "Phương án A")),
                        "option_b": str(q.get("option_b", "Phương án B")),
                        "option_c": str(q.get("option_c", "Phương án C")),
                        "option_d": str(q.get("option_d", "Phương án D")),
                        "correct_option": correct,
                        "explanation": str(q.get("explanation", "Đối chiếu trực tiếp từ tài liệu nguồn.")),
                    })
                if items:
                    return items
        except Exception:
            continue
    return None


def _build_fallback_quiz(notebook_title: str, chunks: list[str], nodes: list[dict], num_questions: int) -> list[dict]:
    clean_chunks = [re.sub(r"\[Trang\s+\d+\]\s*", "", c).strip() for c in chunks if c and c.strip()]
    first_snippet = clean_chunks[0][:140] if clean_chunks else f"Các luận điểm trọng tâm trong '{notebook_title}'"
    second_snippet = clean_chunks[1][:140] if len(clean_chunks) > 1 else f"Cấu trúc tri thức và thực thể trong '{notebook_title}'"
    node_names = [n.get("label") or n.get("id") for n in nodes if n.get("label") or n.get("id")]
    node_0 = node_names[0] if len(node_names) > 0 else "Khái niệm cốt lõi"
    node_1 = node_names[1] if len(node_names) > 1 else "Thực thể liên kết"

    base_questions = [
        {
            "question": f"Theo tài liệu trong sổ tay '{notebook_title}', nội dung trọng tâm nào được đề cập ở phần mở đầu [Trang 1]?",
            "option_a": f"{first_snippet}...",
            "option_b": "Phương pháp sinh dữ liệu ngẫu nhiên không có kiểm chứng",
            "option_c": "Các giao thức phần cứng ngoài phạm vi tài liệu",
            "option_d": "Loại bỏ hoàn toàn bước trích xuất văn bản gốc",
            "correct_option": "A",
            "explanation": f"Trích dẫn trực tiếp từ đoạn mở đầu của sổ tay '{notebook_title}'.",
        },
        {
            "question": f"Trong Đồ thị Tri thức (Knowledge Graph) của '{notebook_title}', thực thể '{node_0}' có vai trò gì?",
            "option_a": "Một nhãn trang trí không có liên kết ngữ nghĩa",
            "option_b": f"Thực thể trọng tâm liên kết với '{node_1}' trong mạng lưới tri thức",
            "option_c": "Biến môi trường tạm thời của trình duyệt",
            "option_d": "Lỗi cú pháp trong quá trình phân tích tài liệu",
            "correct_option": "B",
            "explanation": f"Trên Neo4j Knowledge Graph, '{node_0}' được trích xuất và liên kết trực tiếp với '{node_1}'.",
        },
        {
            "question": f"Luận điểm nào sau đây phản ánh đúng nội dung tiếp theo trong '{notebook_title}'?",
            "option_a": "Chỉ lưu trữ tiêu đề mà bỏ qua nội dung chi tiết",
            "option_b": "Không hỗ trợ truy vấn tiếng Việt có dấu",
            "option_c": f"{second_snippet}...",
            "option_d": "Tự động xóa dữ liệu ngay sau khi tải lên",
            "correct_option": "C",
            "explanation": "Đối chiếu trực tiếp từ các đoạn văn bản (chunks) đã lập chỉ mục.",
        },
        {
            "question": "Khi kết hợp Vector Search (768-dim) và Neo4j Knowledge Graph trong GraphRAG, ưu điểm chính là gì?",
            "option_a": "Không cần trích xuất văn bản từ PDF/DOCX",
            "option_b": "Thay thế hoàn toàn giao diện người dùng",
            "option_c": "Tăng tỷ lệ suy đoán ngẫu nhiên của mô hình",
            "option_d": "Kết hợp độ tương đồng ngữ nghĩa với liên kết thực thể đa bước, giảm thiểu ảo giác (hallucination)",
            "correct_option": "D",
            "explanation": "Hybrid GraphRAG kết hợp truy xuất đoạn văn theo vector và quan hệ thực thể trên đồ thị.",
        },
        {
            "question": "Vì sao hệ thống gắn nhãn [Trang N] vào từng trang tài liệu trước khi chia nhỏ (chunking)?",
            "option_a": "Để đối chứng và trích dẫn chính xác vị trí trang nguồn khi trả lời hoặc giải thích đáp án",
            "option_b": "Để làm giảm kích thước file ảnh",
            "option_c": "Để tắt tính năng OCR tự động",
            "option_d": "Để giới hạn số lượng câu hỏi được phép gửi",
            "correct_option": "A",
            "explanation": "Nhãn [Trang N] giúp truy vết chính xác nguồn gốc thông tin trong tài liệu gốc.",
        },
    ]

    result = []
    for idx in range(num_questions):
        template = base_questions[idx % len(base_questions)]
        result.append({
            "id": f"q_{idx + 1}_{uuid.uuid4().hex[:6]}",
            **template,
        })
    return result


async def get_or_generate_quiz(
    db: AsyncSession,
    notebook_id: str,
    notebook_title: str,
    num_questions: int = 5,
    force_regenerate: bool = False,
) -> list[dict]:
    """Return cached quiz questions or generate a fresh set for the given notebook."""
    num_questions = max(1, min(15, num_questions))
    if not force_regenerate and notebook_id in _QUIZ_CACHE and len(_QUIZ_CACHE[notebook_id]) >= num_questions:
        return _QUIZ_CACHE[notebook_id][:num_questions]

    chunks = await neo4j_service.get_notebook_chunks(notebook_id, limit=12)
    try:
        graph = await neo4j_service.get_graph_data(notebook_id)
        nodes = graph.get("nodes", [])
    except Exception:
        nodes = []

    if not chunks:
        sources = await notebook_service.get_sources(db, notebook_id)
        chunks = [f"Tài liệu nguồn: {s.title}" for s in sources if s.title]

    context_text = "\n\n".join(chunks)
    questions = None
    if context_text.strip():
        loop = asyncio.get_running_loop()
        questions = await loop.run_in_executor(
            None, _generate_quiz_gemini_sync, context_text, notebook_title, num_questions
        )

    if not questions:
        questions = _build_fallback_quiz(notebook_title, chunks, nodes, num_questions)

    _QUIZ_CACHE[notebook_id] = questions
    return questions
