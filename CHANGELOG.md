# Changelog

All notable changes to **Skibidi-UngdungTomTatTaiLieu** are documented in this file.

## [Unreleased]
### Added
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

