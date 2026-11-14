# AGENTS.md — Skibidi-UngdungTomTatTaiLieu

> Universal instructions for AI coding agents (Codex, Antigravity, Cursor, Claude Code) working on the **Skibidi** Document Summarization & GraphRAG platform.

## 1. Project Context & Architecture
Read these core files before making architectural or cross-module changes:
- `README.md` — Project overview, environment setup, and usage guide.
- `docs/architecture.md` — C4 architecture, sequence diagrams, PostgreSQL/pgvector + Neo4j schema, and 16 API endpoints.
- `.ai/STEERING.md` — Engineering principles, coding standards, and strict prohibitions.

### Repository Layout
- `backend/` — Python 3.11+ FastAPI, Async SQLAlchemy, PostgreSQL + `pgvector` (768-dim), Neo4j (GraphRAG), Gemini 2.5 Flash & Multimodal OCR.
- `frontend/` — Next.js 16 (App Router), React 19, Tailwind CSS, Dark-Mode UI (`#090a0f`), Playwright E2E.
- `flutter_app/` — Flutter mobile/cross-platform client (has its own `flutter_app/AGENTS.md` and `flutter_app/CLAUDE.md`).
- `docs/` — Production documentation (Architecture, PRD, OpenAPI, User Manual, Runbook, ADR, Design Guide).
- `.agents/skills/` & `myskill/` — Specialized agent skills (`documentation-specialist`, `open-design`, `open-code-review`, `playwright`, `maestro`, `myskill`).
- `.codex/agents/` — Pre-defined Codex subagents (`fastapi-developer`, `nextjs-developer`, `flutter-expert`, `code-reviewer`, `anti-ui-slop-reviewer`, `api-designer`, `architect-reviewer`, `debugger`).

## 2. Mandatory Commands & Verification
Before completing any task, run the relevant checks for the modified module:
- **Backend (`backend/`):** `pytest -v`
- **Frontend (`frontend/`):** `npm run build` and `npx playwright test`
- **Flutter (`flutter_app/`):** `flutter analyze` and `flutter test`

## 3. Specialized Skill Routing
- **Documentation (`docs/`, `README.md`, `openapi.yaml`):** Follow `.agents/skills/documentation-specialist/SKILL.md`.
- **Frontend UI / Styling:** Follow `.agents/skills/open-design/SKILL.md` and `docs/DESIGN-GUIDE.md`.
- **Document Summarization / RAG Format:** Follow `myskill/SKILL.md`.
- **Code Review:** Follow `.agents/skills/open-code-review/SKILL.md` or `.agents/skills/open-code-review-delegate/SKILL.md`.
- **Web E2E Testing:** Follow `.agents/skills/playwright/SKILL.md`.
- **Mobile E2E Testing:** Follow `.agents/skills/maestro/SKILL.md`.

## 4. Workflow Rules
1. **Plan First for Complex Changes:** Inspect affected routers, services, schemas, and UI components before editing.
2. **Preserve Data Contracts:** Keep FastAPI Pydantic schemas, `docs/openapi.yaml`, Next.js API calls, and Flutter models synchronized.
3. **Never Leak Secrets:** Never commit `.env`, `.env.local`, API keys, or uploaded user files.
4. **Keep Docs Updated:** Update `CHANGELOG.md` and relevant files in `docs/` when adding endpoints, models, or features.

