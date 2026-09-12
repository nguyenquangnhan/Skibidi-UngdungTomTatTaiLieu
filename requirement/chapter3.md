# Chương 3. AI trong Phân tích Yêu cầu & Sản phẩm
## Dự án: Skibidi — Nền Tảng Trích Xuất & Hỏi Đáp Tài Liệu Thông Minh

> **Skibidi** là hệ thống hỏi đáp và tóm tắt tài liệu thông minh kết hợp **GraphRAG**, **OCR đa mô hình PP-OCRv6**, và **Google Gemini AI** — xây dựng theo kiến trúc full-stack hiện đại (Next.js 15 + FastAPI + Neo4j + PostgreSQL).

---

## 3.1 Khám phá Sản phẩm (Product Discovery)

### 3.1.1 Bối cảnh & Vấn đề Phát hiện

**Vấn đề thực tế được xác định:**

Sinh viên, nhà nghiên cứu và người đi làm thường xuyên phải xử lý lượng lớn tài liệu (PDF, hình ảnh, trang web). Các giải pháp hiện có như NotebookLM (Google) hoặc Nextjs-RAG-Notebook đều có những hạn chế rõ ràng:

| Vấn đề | Mô tả | Tác động |
|---|---|---|
| Chỉ vector search đơn giản | Không hiểu quan hệ giữa các thực thể | Câu trả lời thiếu ngữ cảnh sâu |
| Không có OCR | Không đọc được PDF scan hoặc hình ảnh | Bỏ lỡ 40-60% tài liệu thực tế |
| Không hỗ trợ tiếng Việt | OCR không nhận diện ký tự Việt | Không dùng được cho nội dung Việt |
| Phụ thuộc cloud đắt tiền | Qdrant Cloud, OpenAI API | Chi phí cao khi scale |
| Không có Auth | Không bảo vệ dữ liệu người dùng | Không dùng cho môi trường thực |

### 3.1.2 Phương pháp Khám phá Sản phẩm

**So sánh cạnh tranh (Competitive Analysis) — phân tích thực tế:**

```
Nguồn tham khảo phân tích:
1. Nextjs-RAG-Notebook (github.com/shivam-911/Nextjs-RAG-Notebook)
   → Pipeline: Upload → Chunk → Embed → Vector Search → Chat
   → Hạn chế: OpenAI only, Qdrant Cloud, không OCR, không Auth

2. NotebookLM (Google)
   → Điểm mạnh: UX tốt, Gemini integration
   → Hạn chế: Không tự host, không custom pipeline

3. RAGFlow, Dify (dùng PaddleOCR)
   → Bài học: PP-OCRv6 là lựa chọn OCR tốt nhất hiện tại
```

**Insight dẫn đến quyết định sản phẩm:**

| Insight | Quyết định Sản phẩm |
|---|---|
| 40% tài liệu học thuật là PDF scan | Tích hợp PP-OCRv6 hỗ trợ 50+ ngôn ngữ |
| Vector search đơn thuần bỏ sót quan hệ ngữ nghĩa | Xây dựng Knowledge Graph (GraphRAG) |
| Người dùng cần bảo mật dữ liệu | JWT Auth + Google OAuth2 |
| Chi phí cloud là rào cản | Self-hosted: Neo4j local + Docker Compose |
| Người dùng muốn hiểu tài liệu, không chỉ tóm tắt | SSE Streaming Chat + Knowledge Graph visualization |

### 3.1.3 Lợi thế Cạnh tranh Xác định được

```
Pipeline Skibidi (sau Product Discovery):
Upload → OCR(PP-OCRv6) → Chunk → Embed
       → Vector Search ──┐
       → KG Extraction  ─┤→ GraphRAG → Gemini 2.5 Flash → Streaming Chat
       → Graph Traverse ─┘

Vs. Đối thủ:
Upload → Chunk → Embed → Vector Search → Chat
```

### 3.1.4 Công cụ AI áp dụng trong Discovery

| Công cụ | Áp dụng cụ thể trong Skibidi |
|---|---|
| **Google Gemini 2.5 Flash** | Phân tích nhu cầu người dùng, so sánh giải pháp |
| **RAGAS Framework** | Đánh giá định lượng chất lượng RAG pipeline (`evaluate_ragas.py`) |
| **PaddleOCR Analytics** | Benchmark tốc độ: PP-OCRv6 nhanh 5.2× so PP-OCRv5 |
| **Neo4j Graph Analytics** | Khám phá pattern trong dữ liệu tri thức |

---

## 3.2 Tài liệu Yêu cầu Sản phẩm (PRD)

### 3.2.1 PRD Tổng quan — Skibidi v0.2.0

```
Tên sản phẩm: Skibidi — Ứng Dụng Tóm Tắt & Hỏi Đáp Tài Liệu
Phiên bản:    v0.2.0
Nhóm:         Đề tài Chuyên đề N4
Thời gian:    2026
```

#### Mục tiêu Kinh doanh
Xây dựng nền tảng hỏi đáp tài liệu thông minh, tự host, hỗ trợ tiếng Việt, sử dụng GraphRAG để trả lời chính xác và toàn diện hơn các hệ thống vector search thông thường.

#### Đối tượng Người dùng Mục tiêu
- **Sinh viên đại học** — đọc tài liệu học thuật, luận văn, giáo trình
- **Nhà nghiên cứu** — tổng hợp papers, báo cáo khoa học
- **Người đi làm** — tóm tắt tài liệu công việc, hợp đồng, báo cáo

#### Mục tiêu & Chỉ số Thành công (OKRs)

| Objective | Key Result | Đo lường |
|---|---|---|
| Xử lý đa dạng tài liệu | Hỗ trợ PDF text, PDF scan, ảnh, URL | Unit test pass |
| Trả lời chính xác | RAGAS Faithfulness ≥ 0.8 | `evaluate_ragas.py` |
| Tốc độ phản hồi | Thời gian đến token đầu tiên ≤ 3s | SSE streaming |
| Hỗ trợ tiếng Việt | OCR tiếng Việt accuracy ≥ 90% | PP-OCRv6 benchmark |
| Bảo mật | Auth hoạt động, JWT không expire sớm | Integration test |

### 3.2.2 Yêu cầu Chức năng (Functional Requirements)

**FR-01: Xác thực Người dùng**
- Đăng ký / Đăng nhập bằng Email + Password (bcrypt, JWT 7 ngày)
- Đăng nhập bằng Google OAuth2 (verify ID Token)
- API: `POST /auth/register`, `POST /auth/login`, `POST /auth/google`

**FR-02: Quản lý Notebook**
- CRUD Notebook (tạo, xem, xóa)
- Mỗi notebook chứa nhiều sources và lịch sử chat riêng biệt
- API: `GET/POST /api/notebooks`, `DELETE /api/notebooks/{id}`

**FR-03: Xử lý Tài liệu**
- Upload PDF có text → trích xuất bằng PyMuPDF
- Upload PDF scan → OCR bằng PP-OCRv6 (song song, 3 workers, 75 DPI)
- Upload ảnh (PNG, JPG, WEBP) → PP-OCRv6 với `lang=vi`
- Thêm URL → scrape bằng httpx + BeautifulSoup
- Fallback: Gemini Vision cho ảnh phức tạp
- API: `POST /api/notebooks/{id}/sources/upload`, `/sources/url`

**FR-04: RAG Pipeline — Chat Hỏi Đáp**
- Chunk văn bản (1000 chars, overlap 200)
- Embedding bằng `models/gemini-embedding-001` (768-dim)
- Lưu vào Neo4j vector store (cosine, HNSW)
- Trích xuất Knowledge Graph bằng Gemini (entities + relations)
- Khi chat: Vector search (top-5) + Graph traversal → Gemini 2.5 Flash → SSE
- API: `POST /api/notebooks/{id}/chat` (streaming)

**FR-05: Trực quan hóa Knowledge Graph**
- Hiển thị graph 2D interactive bằng `react-force-graph-2d`
- Nodes: Person, Organization, Concept và các entity khác
- Edges: quan hệ được Gemini trích xuất từ tài liệu
- API: `GET /api/notebooks/{id}/graph`

**FR-06: Đánh giá Chất lượng RAG**
- Script `evaluate_ragas.py` đánh giá Faithfulness, Answer Relevancy, Context Precision/Recall
- Xuất báo cáo Excel bằng `generate_evaluation_excel.py`

### 3.2.3 Yêu cầu Phi chức năng (Non-functional Requirements)

| NFR | Yêu cầu | Hiện thực hóa |
|---|---|---|
| **Hiệu năng** | OCR song song tối đa 3 workers | `ProcessPoolExecutor` trong `document_processor.py` |
| **Streaming** | Phản hồi AI theo từng token | SSE (Server-Sent Events) |
| **Bảo mật** | Password không lưu plain text | bcrypt hash (`passlib[bcrypt]`) |
| **Khả năng mở rộng** | Database async | SQLAlchemy asyncio + asyncpg |
| **Self-hosted** | Không phụ thuộc cloud | Docker Compose (PostgreSQL + Neo4j) |
| **Đa ngôn ngữ** | Hỗ trợ 50+ ngôn ngữ OCR | PP-OCRv6 unified model |

### 3.2.4 Phạm vi (In-scope / Out-of-scope)

**✅ Trong phạm vi (v0.2.0):**
- GraphRAG pipeline hoàn chỉnh
- PP-OCRv6 OCR đa ngôn ngữ
- JWT + Google OAuth2
- Knowledge Graph visualization
- RAGAS evaluation

**❌ Ngoài phạm vi:**
- Mobile app (iOS/Android)
- Multi-tenant / SaaS pricing
- Real-time collaborative editing
- Fine-tuning LLM

---

## 3.3 Phân tích Yêu cầu

### 3.3.1 Phân loại Yêu cầu Dự án Skibidi

```
Yêu cầu Skibidi
├── Yêu cầu Chức năng
│   ├── Auth (JWT + Google OAuth2)
│   ├── Notebook Management (CRUD)
│   ├── Document Processing (PDF/Image/URL)
│   ├── RAG Pipeline (Vector + Graph)
│   ├── Streaming Chat (SSE)
│   └── KG Visualization (react-force-graph-2d)
│
├── Yêu cầu Phi chức năng
│   ├── Hiệu năng: OCR parallel, async DB
│   ├── Bảo mật: bcrypt, JWT, CORS config
│   ├── Độ chính xác: RAGAS metrics ≥ 0.8
│   └── Khả năng mở rộng: Docker, Neo4j HNSW index
│
└── Ràng buộc Kỹ thuật
    ├── Python >= 3.12 (match-case, tomllib...)
    ├── Node.js >= 18 (Next.js 15 requirement)
    ├── Docker & Docker Compose (bắt buộc cho DB)
    └── Google Gemini API Key (bắt buộc)
```

### 3.3.2 Phân tích Yêu cầu theo Layers Kiến trúc

#### Layer 1: Frontend (Next.js 15 + React 19)

| Component | Yêu cầu phân tích | Kết quả |
|---|---|---|
| `AuthModal.jsx` | Người dùng cần 2 cách đăng nhập | Email form + Google OAuth button |
| `DocumentUpload.jsx` | Hỗ trợ nhiều loại file | Accept: PDF, PNG, JPG, WEBP + URL input |
| `ChatInterface.jsx` | Streaming để UX tốt hơn | SSE reader + incremental render |
| `KnowledgeGraph.jsx` | Visualize graph phức tạp | react-force-graph-2d (Canvas-based) |
| `DocumentList.jsx` | Xem trạng thái xử lý | Status: processing / ready / error |
| `SourceViewer.jsx` | Preview tài liệu gốc | Serve file từ `/sources/{sid}/file` |

#### Layer 2: Backend (FastAPI + Python 3.12)

| Service | Yêu cầu phân tích | Hiện thực |
|---|---|---|
| `auth_service.py` | Bảo mật password + token | bcrypt + PyJWT HS256 |
| `document_processor.py` | Xử lý đa loại file | PyMuPDF + PaddleOCR + httpx/BS4 |
| `embedding_service.py` | Vector storage | `gemini-embedding-001` → Neo4j 768-dim |
| `neo4j_service.py` | Graph storage + search | Neo4j Bolt + HNSW vector index |
| `rag_service.py` | Tổng hợp answer | Vector search + Graph traversal → Gemini |
| `notebook_service.py` | Business logic | CRUD + source management |

#### Layer 3: Databases

| Database | Yêu cầu | Lý do chọn |
|---|---|---|
| **PostgreSQL 16** | Lưu users, notebooks, sources, chat | Relational, ACID, async support |
| **Neo4j 5.12** | Lưu vectors + Knowledge Graph | Graph native + built-in vector index |

### 3.3.3 Yêu cầu Phát hiện từ Phân tích

**Yêu cầu ẩn (Hidden Requirements) — phát hiện khi phân tích sâu:**

1. **OCR phải chạy parallel** — PDF nhiều trang cần `ProcessPoolExecutor` để không block API
2. **Fallback OCR** — Gemini Vision backup khi PP-OCRv6 thất bại với ảnh phức tạp
3. **CORS configuration** — Frontend (port 3000) call Backend (port 8000) cần CORS headers
4. **Chunk overlap** — 200 chars overlap để không mất ngữ cảnh giữa các chunk
5. **JWT expiry 7 ngày** — Người dùng không muốn login lại mỗi ngày

**Mâu thuẫn yêu cầu được giải quyết:**

| Mâu thuẫn | Giải pháp |
|---|---|
| Tốc độ vs. Chất lượng OCR | PP-OCRv6 `medium` (34.5M params): cân bằng tốt nhất |
| Vector search vs. Graph search | Kết hợp cả hai: top-5 vector + graph traversal |
| Self-hosted vs. Tính năng cloud | Docker Compose cho DB, chỉ Gemini API là external |

---

## 3.4 User Stories & Tiêu chí Chấp nhận

### 3.4.1 Epic Map của Skibidi

```
Epic 1: Xác thực & Quản lý Tài khoản
  └── US-01: Đăng ký tài khoản
  └── US-02: Đăng nhập Email/Password
  └── US-03: Đăng nhập Google OAuth2

Epic 2: Quản lý Notebook
  └── US-04: Tạo notebook mới
  └── US-05: Xem danh sách notebooks
  └── US-06: Xóa notebook

Epic 3: Xử lý Tài liệu
  └── US-07: Upload PDF có text
  └── US-08: Upload PDF scan (OCR)
  └── US-09: Upload ảnh (PNG/JPG)
  └── US-10: Thêm tài liệu từ URL

Epic 4: Hỏi Đáp RAG
  └── US-11: Chat hỏi đáp với AI (streaming)
  └── US-12: Xem lịch sử chat
  └── US-13: Xem nguồn tài liệu được trích dẫn

Epic 5: Knowledge Graph
  └── US-14: Xem Knowledge Graph tương tác

Epic 6: Đánh giá Chất lượng
  └── US-15: Chạy RAGAS evaluation
  └── US-16: Xuất báo cáo Excel
```

### 3.4.2 User Stories Chi tiết

#### US-07: Upload PDF scan (OCR — tính năng cốt lõi)

```
Là sinh viên có tài liệu giáo trình dạng PDF scan,
Tôi muốn upload file PDF scan vào notebook,
Để AI có thể đọc và trả lời câu hỏi từ nội dung tài liệu đó.

Priority: HIGH | Story Points: 13
Component: DocumentUpload.jsx + document_processor.py (PP-OCRv6)
```

**Tiêu chí Chấp nhận (Gherkin):**

```gherkin
Scenario: Upload thành công PDF scan tiếng Việt
  Given người dùng đã đăng nhập và tạo notebook
  And người dùng có file PDF scan tiếng Việt (< 50MB)
  When người dùng chọn file và nhấn "Upload"
  Then hệ thống hiển thị trạng thái "Processing..."
  And PP-OCRv6 xử lý song song (tối đa 3 workers) các trang PDF
  And sau khi xong, trạng thái chuyển sang "Ready"
  And người dùng có thể đặt câu hỏi về nội dung tài liệu

Scenario: PDF scan quá lớn
  Given người dùng upload file PDF scan > 50MB
  When hệ thống nhận file
  Then hiển thị thông báo lỗi rõ ràng
  And file không được lưu vào database

Scenario: PDF scan ảnh phức tạp — fallback Gemini Vision
  Given người dùng upload PDF scan với ảnh chất lượng thấp
  When PP-OCRv6 không đọc được nội dung
  Then hệ thống tự động fallback sang Gemini Vision OCR
  And kết quả cuối cùng vẫn được lưu thành công
```

#### US-11: Chat hỏi đáp với AI (Streaming — tính năng chính)

```
Là nhà nghiên cứu đang đọc nhiều paper,
Tôi muốn hỏi AI câu hỏi về nội dung các tài liệu trong notebook,
Để nhận câu trả lời tổng hợp ngay lập tức mà không phải đọc từng tài liệu.

Priority: HIGH | Story Points: 13
Component: ChatInterface.jsx + rag_service.py
```

**Tiêu chí Chấp nhận (Gherkin):**

```gherkin
Scenario: Chat với GraphRAG thành công
  Given người dùng đã upload ít nhất 1 tài liệu vào notebook
  And tài liệu đã ở trạng thái "Ready"
  When người dùng nhập câu hỏi và nhấn Send
  Then hệ thống thực hiện vector search (top-5 chunks, cosine similarity)
  And thực hiện graph traversal trên Knowledge Graph
  And gửi context (chunks + KG relationships) tới Gemini 2.5 Flash
  And câu trả lời hiển thị dần dần qua SSE streaming
  And thời gian đến token đầu tiên <= 3 giây

Scenario: Không có tài liệu nào trong notebook
  Given notebook rỗng (chưa upload tài liệu)
  When người dùng nhập câu hỏi
  Then AI thông báo "Chưa có tài liệu nào trong notebook"
  And gợi ý người dùng upload tài liệu trước

Scenario: Câu trả lời bao gồm thông tin từ Knowledge Graph
  Given notebook có tài liệu chứa thực thể Person và Organization
  When người dùng hỏi về mối quan hệ giữa các thực thể
  Then câu trả lời sử dụng thông tin từ cả vector search lẫn KG
  And độ chính xác (RAGAS Faithfulness) >= 0.8
```

#### US-14: Xem Knowledge Graph tương tác

```
Là người dùng muốn hiểu cấu trúc kiến thức trong tài liệu,
Tôi muốn xem đồ thị tri thức được trích xuất từ các tài liệu,
Để nắm được các thực thể quan trọng và mối quan hệ giữa chúng.

Priority: MEDIUM | Story Points: 8
Component: KnowledgeGraph.jsx (react-force-graph-2d)
```

**Tiêu chí Chấp nhận (Gherkin):**

```gherkin
Scenario: Hiển thị Knowledge Graph sau khi xử lý tài liệu
  Given notebook có ít nhất 1 tài liệu đã xử lý xong
  When người dùng click tab "Knowledge Graph"
  Then hệ thống gọi GET /api/notebooks/{id}/graph
  And hiển thị graph 2D interactive với nodes và edges
  And người dùng có thể kéo thả, zoom in/out
  And hover vào node hiển thị tên entity và type

Scenario: Graph rỗng khi chưa trích xuất được entity
  Given tài liệu có nội dung đơn giản, không có entity rõ ràng
  When người dùng mở tab Knowledge Graph
  Then hiển thị thông báo "Chưa có đủ dữ liệu để hiển thị graph"
```

#### US-03: Đăng nhập Google OAuth2

```
Là người dùng không muốn tạo thêm tài khoản mới,
Tôi muốn đăng nhập bằng tài khoản Google của mình,
Để truy cập nhanh mà không phải nhớ thêm mật khẩu.

Priority: MEDIUM | Story Points: 5
Component: AuthModal.jsx + auth_service.py (Google OAuth2)
```

**Tiêu chí Chấp nhận (Gherkin):**

```gherkin
Scenario: Đăng nhập Google lần đầu (tạo account mới)
  Given người dùng chưa có tài khoản Skibidi
  When người dùng click "Đăng nhập bằng Google" và hoàn tất OAuth
  Then backend verify Google ID Token qua oauth2.googleapis.com/tokeninfo
  And tự động tạo user mới trong PostgreSQL
  And trả về JWT token (HS256, hết hạn sau 7 ngày)
  And frontend lưu token và chuyển vào app

Scenario: Đăng nhập Google lần sau (link account)
  Given người dùng đã có tài khoản được liên kết với Google
  When người dùng click "Đăng nhập bằng Google"
  Then backend tìm user theo Google email
  And trả về JWT mới mà không tạo account mới

Scenario: Google token không hợp lệ
  Given token Google hết hạn hoặc bị giả mạo
  When backend verify token
  Then trả về 401 Unauthorized
  And frontend hiển thị thông báo lỗi
```

### 3.4.3 Backlog Đầy đủ (Tóm tắt)

| ID | User Story | Priority | Story Points | Sprint |
|---|---|---|---|---|
| US-01 | Đăng ký tài khoản email | HIGH | 5 | Sprint 1 |
| US-02 | Đăng nhập email/password | HIGH | 3 | Sprint 1 |
| US-03 | Đăng nhập Google OAuth2 | MEDIUM | 5 | Sprint 1 |
| US-04 | Tạo notebook mới | HIGH | 3 | Sprint 1 |
| US-07 | Upload PDF scan (PP-OCRv6) | HIGH | 13 | Sprint 2 |
| US-08 | Upload PDF có text | HIGH | 5 | Sprint 2 |
| US-09 | Upload ảnh PNG/JPG | HIGH | 5 | Sprint 2 |
| US-10 | Thêm URL | MEDIUM | 5 | Sprint 2 |
| US-11 | Chat RAG streaming | HIGH | 13 | Sprint 3 |
| US-12 | Xem lịch sử chat | MEDIUM | 3 | Sprint 3 |
| US-14 | Knowledge Graph visualization | MEDIUM | 8 | Sprint 4 |
| US-15 | RAGAS evaluation script | LOW | 8 | Sprint 4 |

---

## 3.5 Đặc tả Tính năng (Feature Specification)

### 3.5.1 Feature Spec: GraphRAG Pipeline (Tính năng Cốt lõi)

#### Tổng quan
Tính năng kết hợp **Vector Search** và **Knowledge Graph Traversal** để tạo context phong phú hơn cho Gemini 2.5 Flash, giúp trả lời chính xác và toàn diện hơn so với vector search đơn thuần.

**Liên kết:** US-11, US-14 | **Owner:** `rag_service.py`, `neo4j_service.py`

#### Luồng Chi tiết

```
[1] INDEXING PHASE (khi upload tài liệu)
──────────────────────────────────────
document_processor.py
  ├── PDF text   → page.get_text() [PyMuPDF]
  ├── PDF scan   → PP-OCRv6 (ProcessPoolExecutor, 3 workers, 75 DPI)
  ├── Image      → PP-OCRv6 (lang=vi) → fallback Gemini Vision
  └── URL        → httpx scrape → BeautifulSoup clean

embedding_service.py
  ├── RecursiveCharacterTextSplitter(size=1000, overlap=200)
  ├── gemini-embedding-001 → 768-dim vectors
  └── Lưu vào Neo4j: (:Chunk {text, embedding, source_id})

neo4j_service.py (KG Extraction)
  ├── Gemini 2.5 Flash → structured JSON (entities + relations)
  ├── Tạo nodes: (:Person), (:Organization), (:Concept)...
  ├── Tạo edges: (Entity)-[DYNAMIC_REL]->(Entity)
  └── Link: (Entity)-[:MENTIONED_IN]->(Chunk)

[2] QUERY PHASE (khi người dùng hỏi)
──────────────────────────────────────
rag_service.py
  ├── Embed query → 768-dim vector
  ├── Neo4j vector search (cosine, top-5 chunks)
  ├── Graph traversal: Chunk → MENTIONED_IN → Entity → Relations
  ├── Build context: chunks text + KG relationships
  └── Gemini 2.5 Flash → SSE Streaming → Frontend
```

#### Đặc tả API Chi tiết

```json
// Chat endpoint (SSE Streaming)
POST /api/notebooks/{notebook_id}/chat
Authorization: Bearer <JWT>
Content-Type: application/json

Request:
{
  "query": "Mối quan hệ giữa X và Y là gì?",
  "include_sources": true
}

Response: text/event-stream
data: {"token": "Dựa"}
data: {"token": " trên"}
data: {"token": " tài"}
...
data: {"token": ".", "sources": ["chunk_id_1", "chunk_id_2"]}
data: [DONE]

// Knowledge Graph endpoint
GET /api/notebooks/{notebook_id}/graph
Authorization: Bearer <JWT>

Response (200 OK):
{
  "nodes": [
    {"id": "entity_1", "label": "Nguyễn Văn A", "type": "Person"},
    {"id": "entity_2", "label": "Công ty XYZ", "type": "Organization"}
  ],
  "edges": [
    {"source": "entity_1", "target": "entity_2", "relation": "WORKS_AT"}
  ]
}
```

#### Neo4j Schema

```cypher
// Nodes
(:Notebook {id, name, user_id})
(:Source {id, filename, type, status, notebook_id})
(:Chunk {id, text, embedding: [768 floats], source_id, chunk_index})
(:Person {name}), (:Organization {name}), (:Concept {name})

// Relationships
(Source)-[:BELONGS_TO]->(Notebook)
(Chunk)-[:PART_OF]->(Source)
(Entity)-[:MENTIONED_IN]->(Chunk)
(Entity)-[DYNAMIC_REL {description}]->(Entity)

// Vector Index
CREATE VECTOR INDEX chunk_vector_index
FOR (c:Chunk) ON (c.embedding)
OPTIONS {indexConfig: {
  `vector.dimensions`: 768,
  `vector.similarity_function`: 'cosine'
}}
```

#### Edge Cases & Error Handling

| Trường hợp | Xử lý | File |
|---|---|---|
| PDF scan > nhiều trang | ProcessPoolExecutor giới hạn 3 workers | `document_processor.py` |
| PP-OCRv6 thất bại | Fallback sang Gemini Vision (async) | `document_processor.py` |
| Neo4j không kết nối được | 503 Service Unavailable | `neo4j_service.py` |
| Gemini API rate limit | Retry với exponential backoff | `rag_service.py` |
| Chunk quá dài cho embedding | Splitter tự động chia nhỏ | `embedding_service.py` |
| Query không tìm thấy chunk nào | Trả về "Không tìm thấy thông tin liên quan" | `rag_service.py` |
| JWT hết hạn | 401 Unauthorized, frontend redirect login | `auth_service.py` |

#### Yêu cầu Hiệu năng

| Metric | Target | Đo lường |
|---|---|---|
| OCR throughput | >= 10 trang/giây (75 DPI, 3 workers) | Benchmark local |
| Time-to-first-token | <= 3 giây | SSE stream timing |
| Vector search latency | <= 500ms (top-5) | Neo4j query timing |
| RAGAS Faithfulness | >= 0.8 | `evaluate_ragas.py` |
| RAGAS Answer Relevancy | >= 0.75 | `evaluate_ragas.py` |

---

### 3.5.2 Feature Spec: PP-OCRv6 Document Processing

#### Tổng quan
Tính năng xử lý tài liệu đa dạng với OCR tốt nhất hiện tại (PP-OCRv6, 2026), hỗ trợ 50+ ngôn ngữ bao gồm tiếng Việt.

**Liên kết:** US-07, US-08, US-09 | **Owner:** `document_processor.py`

#### Pipeline OCR Chi tiết

```python
# Logic trong document_processor.py

async def process_document(file_path, file_type):
    if file_type == "pdf":
        text = extract_pdf_text(file_path)      # PyMuPDF fast path
        if len(text.strip()) < 100:             # PDF scan detected
            text = await ocr_pdf(file_path)     # PP-OCRv6 path
    elif file_type in ["png", "jpg", "webp"]:
        text = await ocr_image(file_path)       # PP-OCRv6 direct
    elif file_type == "url":
        text = await scrape_url(file_path)      # httpx + BS4

async def ocr_pdf(pdf_path):
    # Render pages → 75 DPI PNG
    # ProcessPoolExecutor(max_workers=3)
    # PP-OCRv6 medium (34.5M params) per page
    # Fallback: Gemini Vision nếu confidence thấp
```

#### Thông số PP-OCRv6

| Tier | Parameters | Usecase |
|---|---|---|
| `tiny` | 1.5M | Mobile, edge devices |
| `small` | 7.7M | Balanced |
| `medium` | 34.5M | **Dùng trong Skibidi** — độ chính xác cao nhất |

**Hiệu năng PP-OCRv6 vs PP-OCRv5:**
- +4.6% detection accuracy
- +5.1% recognition accuracy
- 5.2× CPU inference speedup (OpenVINO backend)
- Hỗ trợ 50 ngôn ngữ với 1 model duy nhất

#### Cấu hình `.env`

```env
PADDLE_OCR_LANG=vi        # Ngôn ngữ mặc định: tiếng Việt
PADDLE_USE_GPU=false      # CPU mode (không cần GPU)
CHUNK_SIZE=1000           # Ký tự mỗi chunk
CHUNK_OVERLAP=200         # Overlap để không mất ngữ cảnh
```

---

### 3.5.3 Feature Spec: Auth System (JWT + Google OAuth2)

#### Tổng quan
Hệ thống xác thực hai lớp: Email/Password với bcrypt + JWT, và Google OAuth2 với ID Token verification.

**Liên kết:** US-01, US-02, US-03 | **Owner:** `auth_service.py`, `AuthModal.jsx`

#### Flow Đăng nhập

```
Email/Password Flow:
[Frontend] → POST /auth/login {email, password}
           → [auth_service] verify bcrypt hash
           → tạo JWT (HS256, payload: user_id, email, exp: +7days)
           → trả về {"access_token": "...", "token_type": "bearer"}

Google OAuth2 Flow:
[Frontend] → Google Sign-In → ID Token
           → POST /auth/google {id_token}
           → [auth_service] verify via oauth2.googleapis.com/tokeninfo
           → auto-create user nếu chưa tồn tại
           → tạo JWT → trả về token
```

#### Data Model (PostgreSQL)

```sql
-- Bảng users
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       VARCHAR(255) UNIQUE NOT NULL,
  hashed_password VARCHAR(255),      -- NULL nếu chỉ dùng Google
  google_id   VARCHAR(255),          -- NULL nếu chỉ email/password
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Bảng notebooks
CREATE TABLE notebooks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Bảng sources
CREATE TABLE sources (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notebook_id UUID REFERENCES notebooks(id) ON DELETE CASCADE,
  filename    VARCHAR(500),
  source_type VARCHAR(50),  -- 'pdf', 'image', 'url'
  status      VARCHAR(50),  -- 'processing', 'ready', 'error'
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Bảng chat_messages
CREATE TABLE chat_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notebook_id UUID REFERENCES notebooks(id) ON DELETE CASCADE,
  role        VARCHAR(20),  -- 'user' | 'assistant'
  content     TEXT NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);
```

---

## Tổng kết Chương 3 — Áp dụng vào Dự án Skibidi

| Mục | Nội dung | Áp dụng thực tế trong Skibidi |
|---|---|---|
| **3.1 Product Discovery** | Phân tích vấn đề & cơ hội | So sánh vs Nextjs-RAG-Notebook, phát hiện thiếu OCR + GraphRAG |
| **3.2 PRD** | Tài liệu hóa toàn bộ yêu cầu | 6 FR chính + NFR hiệu năng/bảo mật + OKRs cụ thể |
| **3.3 Phân tích Yêu cầu** | Phân tích 3 layers kiến trúc | Frontend components, Backend services, DB schema |
| **3.4 User Stories** | 16 User Stories với Gherkin AC | 3 US chi tiết: OCR Upload, Chat RAG, Knowledge Graph |
| **3.5 Feature Spec** | Đặc tả kỹ thuật 3 tính năng | GraphRAG Pipeline, PP-OCRv6, Auth System |

> **Kết luận:** AI đóng vai trò kép trong dự án Skibidi — vừa là **công cụ trong sản phẩm** (Gemini 2.5 Flash, Gemini Embedding, PP-OCRv6) vừa là **công cụ hỗ trợ quy trình** phân tích yêu cầu, viết PRD, tạo User Stories và đặc tả tính năng.
