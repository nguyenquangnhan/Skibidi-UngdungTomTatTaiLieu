# Operations Runbook — Skibidi Production & Troubleshooting

## 1. Service Startup Order
1. **Databases (`backend/docker-compose.yml`):**
   ```bash
   cd backend
   docker compose up -d
   ```
   Verify PostgreSQL (`5432`) and Neo4j (`7474` / `7687`) are healthy.
2. **Backend API:**
   ```bash
   cd backend
   uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```
   Verify health endpoint: `GET http://localhost:8000/api/health`.
   On startup, `lifespan()` automatically initializes PostgreSQL tables, Neo4j vector index, and calls `resume_pending_sources()` to recover interrupted jobs.
3. **Frontend Web:**
   ```bash
   cd frontend
   npm run build && npm run start
   ```

## 2. Health Checks & Monitoring
- **API Health:** `curl http://localhost:8000/api/health` → expected `200 OK`.
- **PostgreSQL + pgvector:** `docker exec -it <postgres_container> pg_isready -U postgres`
- **Neo4j:** Open `http://localhost:7474` or check bolt port `7687`.

## 3. Incident Playbooks
### A. Sources stuck in `pending` or `processing`
1. Check backend logs for Gemini API rate limits (`429`) or network errors.
2. Restart the FastAPI server — `resume_pending_sources()` in `backend/app/main.py` will automatically re-queue incomplete sources using `AsyncSessionLocal()`.
3. Verify `GEMINI_API_KEY` (or comma-separated `GEMINI_API_KEYS`) in `backend/.env`.

### B. `pgvector` Dimension Mismatch Error
- Ensure `EMBEDDING_DIM=768` in `backend/.env` matches `settings.embedding_dim` (`768`) and `output_dimensionality=settings.embedding_dim` in `backend/app/services/embedding_service.py`.

### C. Neo4j Connection Refused
1. Verify container is running: `docker compose ps`.
2. Confirm `NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD` in `backend/.env` match `backend/docker-compose.yml`.

## 4. Backup & Recovery
- **PostgreSQL:** `pg_dump -U postgres -d skibidi > backup_$(date +%F).sql`
- **Uploaded Files:** Back up `backend/uploads/` directory alongside the PostgreSQL dump so `/api/notebooks/{id}/sources/{source_id}/file` remains consistent.

