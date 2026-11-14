# Contributing to Skibidi

Thank you for contributing to **Skibidi-UngdungTomTatTaiLieu**!

## Development Workflow
1. Read `AGENTS.md` and `.ai/STEERING.md` before making changes.
2. Create a feature branch from `main` (e.g., `feat/rag-citations`, `fix/upload-timeout`).
3. Keep API changes synchronized with `docs/openapi.yaml`.
4. Update `CHANGELOG.md` under `[Unreleased]`.

## Verification Checklist Before Opening a PR
- **Backend:** `cd backend && pytest -v`
- **Frontend:** `cd frontend && npm run build && npx playwright test`
- **Flutter:** `cd flutter_app && flutter analyze && flutter test`
- Never commit `.env`, `.env.local`, API keys, or `uploads/` files.

