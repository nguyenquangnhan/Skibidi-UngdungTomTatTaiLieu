# ADR-001: Hybrid GraphRAG Tech Stack Selection

- **Status:** Accepted
- **Date:** 2026-11-14
- **Context:** Hệ thống Skibidi cần xử lý tài liệu đa định dạng (bao gồm PDF scan/ảnh tiếng Việt), tìm kiếm ngữ nghĩa chính xác, suy luận liên kết thực thể và hỗ trợ cả Web lẫn Mobile.

## Decisions
1. **Backend — FastAPI (Python 3.11+) + Async SQLAlchemy:**
   - Hỗ trợ async I/O tốt cho SSE streaming và hệ sinh thái AI/NLP (LangChain, `google-genai`, RAGAS, PyPDF, PaddleOCR).
2. **Vector Store — PostgreSQL 16 + `pgvector` (768-dim):**
   - Lưu cả dữ liệu quan hệ (`users`, `notebooks`, `sources`, `chat_messages`) và vector embeddings (`document_chunks`) trong một database duy nhất, đơn giản hóa triển khai và backup.
3. **Knowledge Graph — Neo4j 5.12 + APOC:**
   - Lưu trữ thực thể và quan hệ trích xuất từ tài liệu để trả lời các câu hỏi tổng hợp đa bước (multi-hop) và trực quan hóa đồ thị tri thức.
4. **LLM & Multimodal OCR — Google Gemini (`gemini-2.5-flash` & `gemini-embedding-001`):**
   - Gemini 2.5 Flash xử lý tốt cả tiếng Việt lẫn OCR tài liệu scan/bảng biểu; giữ PaddleOCR làm fallback khi cần xử lý cục bộ.
5. **Clients — Next.js (App Router) & Flutter:**
   - Next.js cho trải nghiệm Web responsive + `react-force-graph-2d`; Flutter cho ứng dụng Mobile đa nền tảng dùng chung REST/SSE API.

## Consequences
- Cần vận hành 2 container dữ liệu (PostgreSQL và Neo4j) qua `backend/docker-compose.yml`.
- Các tác vụ blocking của SDK Gemini/OCR phải bọc trong `run_in_executor` để không làm treo FastAPI event loop.

