# Architecture document

**System:** Skibidi Document Summarization and Q&A Platform  
**Version:** 0.2.0  
**Status:** Accepted  
**Audience:** Engineers joining the system  
**Voice:** STE100  

---

## Purpose

Skibidi extracts text from PDFs, images, and web pages, builds a Neo4j Knowledge Graph and vector index, and answers user questions through streaming GraphRAG chat. Students, researchers, and developers use the Next.js web app or the Flutter mobile app to organize sources into notebooks and query them.

---

## System context

**In scope:** User authentication, notebook and source management, document OCR and text extraction, vector embedding and Knowledge Graph generation, streaming GraphRAG Q&A, and 2D graph visualization.  
**Out of scope:** Multi-tenant enterprise SSO, real-time collaborative editing, and billing management.

```mermaid
flowchart TB
  user([End User])
  web[Skibidi Web App]
  mobile[Skibidi Flutter App]
  api[Skibidi FastAPI Backend]
  gemini[Google Gemini API]
  oauth[Google OAuth2]

  user --> web
  user --> mobile
  web --> api
  mobile --> api
  api --> gemini
  api --> oauth
```

---

## Containers

| Container | Tech | Role |
|---|---|---|
| Web Frontend | Next.js 15, React 19, TailwindCSS 3 | Provides notebook workspace, upload progress UI, streaming chat, and 2D Knowledge Graph view |
| Mobile App | Flutter, Signals, GetIt, Dio | Provides mobile notebook management and Q&A client |
| Backend API | Python 3.11+, FastAPI, Uvicorn | Exposes REST and SSE endpoints, orchestrates OCR, embeddings, and GraphRAG |
| Relational Store | PostgreSQL 16 (SQLAlchemy async) | Stores `users`, `notebooks`, `sources`, and `chat_messages` |
| Graph & Vector Store | Neo4j 5.12 + APOC | Stores document chunks, 768-dimension vector index, and Knowledge Graph entities |

```mermaid
flowchart LR
  web[Next.js Web App] --> api[FastAPI Backend]
  mobile[Flutter Mobile App] --> api
  api --> pg[(PostgreSQL 16)]
  api --> neo[(Neo4j 5.12)]
  api --> gemini[Google Gemini API]
```

---

## Components

```mermaid
flowchart TB
  subgraph backend [FastAPI Backend]
    routers["Routers (auth, notebooks, sources, chat, graph)"]
    nb_svc[notebook_service]
    doc_proc[document_processor]
    embed_svc[embedding_service]
    neo_svc[neo4j_service]
    rag_svc[rag_service]
  end

  routers --> nb_svc
  routers --> rag_svc
  routers --> neo_svc
  nb_svc --> doc_proc
  nb_svc --> embed_svc
  nb_svc --> neo_svc
  embed_svc --> neo_svc
  rag_svc --> embed_svc
  rag_svc --> neo_svc
```

### API Endpoints

| Method | Path | Router | Purpose |
|---|---|---|---|
| `POST` | `/auth/register` | `auth.py` | Register a local user account |
| `POST` | `/auth/login` | `auth.py` | Authenticate with email and password |
| `POST` | `/auth/google` | `auth.py` | Authenticate with a Google ID token |
| `GET` | `/auth/me` | `auth.py` | Return the authenticated user profile |
| `GET` | `/api/notebooks` | `notebooks.py` | List notebooks for the current user |
| `POST` | `/api/notebooks` | `notebooks.py` | Create a new notebook |
| `DELETE` | `/api/notebooks/{notebook_id}` | `notebooks.py` | Delete a notebook and related data |
| `GET` | `/api/notebooks/{notebook_id}/sources` | `sources.py` | List sources in a notebook |
| `POST` | `/api/notebooks/{notebook_id}/sources/upload` | `sources.py` | Upload a PDF or image file |
| `POST` | `/api/notebooks/{notebook_id}/sources/url` | `sources.py` | Add a web URL source |
| `DELETE` | `/api/notebooks/{notebook_id}/sources/{source_id}` | `sources.py` | Delete a source and its graph chunks |
| `GET` | `/api/notebooks/{notebook_id}/sources/{source_id}/file` | `sources.py` | Download or preview the source file |
| `GET` | `/api/notebooks/{notebook_id}/chat` | `chat.py` | Retrieve chat history |
| `POST` | `/api/notebooks/{notebook_id}/chat` | `chat.py` | Stream a GraphRAG response via SSE |
| `GET` | `/api/notebooks/{notebook_id}/graph` | `graph.py` | Return Knowledge Graph nodes and edges |
| `GET` | `/api/health` | `main.py` | Return backend health status |

### Data Model (PostgreSQL)

| Table | Key Columns | Purpose |
|---|---|---|
| `users` | `id`, `email`, `google_id` | Stores registered accounts |
| `notebooks` | `id`, `user_id`, `title`, `description` | Groups sources and chat threads |
| `sources` | `id`, `notebook_id`, `title`, `source_type`, `status`, `chunk_count` | Tracks uploaded files and URLs |
| `chat_messages` | `id`, `notebook_id`, `role`, `content`, `sources_used` | Persists conversation history |

---

## Key sequences

### 1. Document Upload and Background Processing

```mermaid
sequenceDiagram
  participant U as User
  participant A as FastAPI Backend
  participant P as PostgreSQL
  participant G as Gemini API
  participant N as Neo4j

  U->>A: POST /sources/upload (PDF or image)
  A->>P: Insert source (status = pending)
  A-->>U: 201 Created
  A->>P: Update status = processing
  A->>G: Extract text (Gemini Multimodal OCR)
  A->>G: Embed chunks (768-dim)
  A->>N: Store chunks and vector index
  A->>G: Extract entities and relations
  A->>N: Merge Knowledge Graph nodes
  A->>P: Update status = completed
```

### 2. GraphRAG Streaming Q&A

```mermaid
sequenceDiagram
  participant U as User
  participant A as FastAPI Backend
  participant G as Gemini API
  participant N as Neo4j

  U->>A: POST /chat (question)
  A->>G: Embed query (768-dim)
  A->>N: Vector search + graph traversal
  N-->>A: Relevant chunks and triples
  A->>G: Generate answer stream
  G-->>A: Token stream
  A-->>U: SSE events (sources, tokens, done)
```

---

## Deployment

1. Start PostgreSQL 16 and Neo4j 5.12 containers from `backend/docker-compose.yml`.
2. Configure environment variables in `backend/.env` and `frontend/.env.local`.
3. Start the FastAPI server with Uvicorn on port `8000`.
4. Start the Next.js server on port `3000`.

