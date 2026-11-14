# Project Steering & Engineering Principles — Skibidi

## 1. Core Mandates
- **Backend (`backend/`):** Python 3.11+, FastAPI, Async SQLAlchemy (`AsyncSession`), Pydantic v2.
- **Frontend (`frontend/`):** Next.js App Router, React, Tailwind CSS, Dark-Mode first (`#090a0f`).
- **Mobile (`flutter_app/`):** Flutter / Dart, Feature-first Clean Architecture + MVVM (see `flutter_app/docs/code-standards.md`).
- **Databases:** PostgreSQL 16 + `pgvector` (768-dim `gemini-embedding-001`) and Neo4j 5.12 + APOC.
- **LLM & OCR:** Google Gemini (`gemini-2.5-flash`) with PaddleOCR fallback.

## 2. Backend Coding Rules (`backend/`)
1. **Async Discipline:** Never block the FastAPI event loop with synchronous SDK calls (`google-genai`, `pypdf`, `python-docx`, `paddleocr`). Wrap blocking I/O and CPU work in `asyncio.get_running_loop().run_in_executor(...)`.
2. **Background Tasks DB Session:** Never pass a request-scoped `AsyncSession` into `BackgroundTasks`. Always open a fresh `AsyncSessionLocal()` inside background workers.
3. **Vector Dimensions:** Keep `embedding_dim = 768` consistent across `config.py`, `DocumentChunk` model, and `output_dimensionality` in `embedding_service.py`.
4. **Auth & Isolation:** Every notebook, source, chat, and graph endpoint must verify `current_user.id` ownership.

## 3. Frontend Coding Rules (`frontend/`)
1. **File Uploads:** Never manually set `Content-Type: multipart/form-data` when sending `FormData` (let browser/XHR set the boundary).
2. **SSR & Hydration:** Avoid browser-only DOM APIs during SSR; use `next/dynamic(..., { ssr: false })` for canvas/graph libraries (`react-force-graph-2d`) and `suppressHydrationWarning` on `<html>`/`<body>` when extensions may mutate attributes.
3. **Async Status Feedback:** Poll source status (`pending` / `processing`) until `completed` or `failed`.

## 4. Prohibitions (What We NEVER Do)
- **Never** hardcode `GEMINI_API_KEY`, `SECRET_KEY`, or database passwords in source files.
- **Never** commit `.env`, `.env.local`, `uploads/`, or `.venv/`.
- **Never** fabricate citations or facts outside retrieved chunks in RAG prompts (`myskill/SKILL.md`).
- **Never** skip updating tests or `docs/openapi.yaml` when changing API contracts.

