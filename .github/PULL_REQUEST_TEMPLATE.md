## Summary
<!-- Describe what this PR changes and why -->

## Affected Modules
- [ ] `backend/` (FastAPI / GraphRAG / DB)
- [ ] `frontend/` (Next.js / Playwright)
- [ ] `flutter_app/` (Flutter / Maestro)
- [ ] `docs/` / Agentic config

## Verification Checklist
- [ ] Backend unit/API tests pass (`cd backend && pytest -v`)
- [ ] Frontend builds & Playwright E2E pass (`cd frontend && npm run build && npx playwright test`)
- [ ] Flutter checks pass (`cd flutter_app && flutter analyze && flutter test`)
- [ ] Updated `docs/openapi.yaml` (if API routes/schemas changed)
- [ ] Updated `CHANGELOG.md` under `[Unreleased]`
- [ ] No secrets (`.env`, API keys) or `uploads/` committed

