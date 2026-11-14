# Product Requirements Document (PRD) — Skibidi DocuGraph

## 1. Executive Summary
**Skibidi** là nền tảng tóm tắt tài liệu thông minh và hỏi đáp tri thức dựa trên kiến trúc **Hybrid GraphRAG** (kết hợp Vector Search trên PostgreSQL `pgvector` và Knowledge Graph trên Neo4j), hỗ trợ đa nền tảng (Web Next.js và Mobile Flutter).

## 2. Jobs To Be Done (JTBD) & Target Users
- **Sinh viên / Nghiên cứu sinh:** Khi đọc hàng trăm trang tài liệu học thuật hoặc slide PDF/ảnh scan, tôi muốn hệ thống tự động OCR, tóm tắt ý chính có trích dẫn nguồn và vẽ sơ đồ khái niệm để ôn tập nhanh và chính xác.
- **Nhân viên văn phòng / Chuyên viên phân tích:** Khi nhận hợp đồng, báo cáo hoặc bài viết web dài, tôi muốn đặt câu hỏi trực tiếp bằng tiếng Việt/Anh và nhận câu trả lời bám sát tài liệu gốc (không hallucination).

## 3. Core Features & Scope
| ID | Tính năng | Mô tả | Nền tảng |
| :--- | :--- | :--- | :--- |
| F-01 | **Xác thực người dùng** | Đăng ký, đăng nhập Email/Password (JWT + Bcrypt) và Google OAuth | Web, Mobile, API |
| F-02 | **Quản lý Sổ tay (Notebooks)** | Tạo, xem danh sách, xóa sổ tay; cô lập dữ liệu theo `user_id` | Web, Mobile, API |
| F-03 | **Nạp tài liệu đa định dạng** | Upload PDF, DOCX, TXT, Ảnh (PNG/JPG) kèm thanh tiến trình % hoặc nhập URL | Web, Mobile, API |
| F-04 | **Multimodal OCR & Chunking** | Trích xuất văn bản PDF scan/ảnh bằng Gemini 2.5 Flash (fallback PaddleOCR), chia chunk 1000/200 | Backend |
| F-05 | **Hybrid GraphRAG Chat (SSE)** | Truy vấn song song Vector (768-dim) + Neo4j Graph, stream câu trả lời theo thời gian thực | Web, Mobile, API |
| F-06 | **Knowledge Graph Viewer** | Trực quan hóa thực thể & mối quan hệ bằng đồ thị tương tác 2D | Web |

## 4. Non-Functional Requirements
- **Hiệu năng & Bất đồng bộ:** Upload trả về `201` ngay lập tức (`pending`); xử lý OCR/Embedding/Graph chạy nền không chặn event loop; tự động resume các nguồn `pending`/`processing` khi server khởi động lại.
- **Chất lượng RAG (RAGAS):** Đảm bảo Faithfulness và Answer Relevance cao thông qua script đánh giá `backend/evaluate_ragas.py`.
- **Bảo mật:** Cô lập dữ liệu theo JWT `current_user.id`, mã hóa mật khẩu bằng Bcrypt, không lưu API key trong mã nguồn.

## 5. Out of Scope (v1.0)
- Chia sẻ sổ tay công khai giữa nhiều người dùng (multi-tenant collaboration).
- Xuất file PDF/DOCX báo cáo tóm tắt tự động.

