# Changelog

All notable changes to **Skibidi-UngdungTomTatTaiLieu** are documented in this file.

## [Unreleased]
### Added
- **Phase 1 — Multi-Format Ingestion & Multi-Layer Summary:** `[Trang N]` page markers in PDF/DOCX/TXT extraction, `.docx`/`.txt`/`.md` upload support, `GET /api/notebooks/{notebook_id}/sources/{source_id}/summary` (`TL;DR` + `key_points` + `summary_detailed`), and upgraded `SourceViewer.jsx`.
- **Phase 2 — AI Quiz Generator:** `backend/app/schemas/quiz.py`, `backend/app/services/quiz_service.py`, `backend/app/routers/quiz.py` (`POST /api/notebooks/{notebook_id}/quiz` with Neo4j cache & fallback generator), and interactive `QuizPanel.jsx`.
- **Phase 3 — Live Multiplayer Quiz Battle:** `backend/app/routers/battle.py` (`/api/battle/rooms/*` with 6-digit PIN codes, synchronized server clock, and 500–1000 speed-bonus points) and `BattleArena.jsx`.
- **Phase 4 — Study Groups & Zero-Token Resource Sharing:** `backend/app/routers/groups.py` (`/api/groups/*` with `VKUxxx` PIN codes, live member sync, and Zero-Token AI summary sharing) and `StudyGroups.jsx`.
- **Phase 5 — Automated Verification & API Spec:** Unit/integration tests for Quiz, Live Battle, and Study Groups in `backend/tests/test_api.py`, Playwright workspace tab verification in `frontend/e2e/skibidi-app.spec.js`, and OpenAPI 3.1 updates in `docs/openapi.yaml`.
- Root Agentic configuration (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.ai/STEERING.md`).
- Selected Codex subagents in `.codex/agents/` (`fastapi-developer`, `nextjs-developer`, `flutter-expert`, `code-reviewer`, `anti-ui-slop-reviewer`, `api-designer`, `architect-reviewer`, `debugger`).
- Production documentation suite in `docs/`: `architecture.md`, `openapi.yaml`, `PRD.md`, `ADR-001-tech-stack.md`, `DESIGN-GUIDE.md`, `user-manual.md`, `runbook.md`.
- Root `CONTRIBUTING.md`, `.github/PULL_REQUEST_TEMPLATE.md`, `.github/ISSUE_TEMPLATE/`, and `.github/workflows/ci.yml`.
- Expanded Playwright Web E2E tests and Skibidi-specific Maestro mobile test flow.

## [1.0.0] - 2026-11-14
### Added
- `documentation-specialist` skill and initial `docs/architecture.md` (C4 + Sequence diagrams).
- Usage guide section (`## 📖 Hướng Dẫn Sử Dụng`) in `README.md`.
- Google Gemini Multimodal OCR (`gemini-2.5-flash`) with PaddleOCR fallback.
- Upload progress bar (`0%`–`100%`) and automatic status polling (`pending`/`processing` → `completed`).
- Startup recovery (`resume_pending_sources()`) for interrupted document ingestion jobs.

### Fixed
- Fixed `422 Unprocessable Entity` on `FormData` file upload in `frontend/context/AuthContext.jsx`.
- Fixed React 19 `createRoot` / `unmount()` race condition and `ResizeObserver` sizing in `frontend/components/KnowledgeGraph.jsx`.
- Fixed Next.js SSR hydration mismatch warning in `frontend/app/layout.jsx`.
- Fixed event loop blocking in `embedding_service.py` and `neo4j_service.py` via `run_in_executor`.

