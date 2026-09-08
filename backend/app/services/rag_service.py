"""
RAG Service
- Vector search + Knowledge Graph traversal
- Gemini 2.5 Flash streaming response via SSE
"""
import json
from typing import AsyncGenerator
from google import genai
from google.genai import types

from app.config import get_settings
from app.services import embedding_service, neo4j_service

settings = get_settings()


def _build_context(chunks: list[dict], entities: list[dict]) -> str:
    """Build RAG context string from retrieved chunks and KG entities."""
    context_parts = []

    if chunks:
        context_parts.append("=== Đoạn văn bản liên quan ===")
        for i, chunk in enumerate(chunks, 1):
            context_parts.append(f"[{i}] {chunk['text']}")

    if entities:
        context_parts.append("\n=== Thông tin từ Đồ thị Tri thức ===")
        seen = set()
        for e in entities:
            if e.get("relation") and e.get("entity") and e.get("target"):
                triple = f"{e['entity']} —[{e['relation']}]→ {e['target']}"
                if triple not in seen:
                    context_parts.append(triple)
                    seen.add(triple)

    return "\n".join(context_parts)


async def chat_stream(
    notebook_id: str,
    question: str,
    chat_history: list[dict] | None = None,
) -> AsyncGenerator[str, None]:
    """
    RAG pipeline with streaming SSE output.
    Yields Server-Sent Event strings.
    """
    # 1. Embed query
    query_embedding = await embedding_service.embed_query(question)

    # 2. Vector search
    top_chunks = await neo4j_service.vector_search(
        notebook_id, query_embedding, top_k=settings.rag_top_k
    )

    # 3. KG traversal
    chunk_ids = [c["chunk_id"] for c in top_chunks]
    entities = []
    if chunk_ids:
        entities = await neo4j_service.get_related_entities(chunk_ids)

    # 4. Build context
    context = _build_context(top_chunks, entities)
    source_ids = list({c["source_id"] for c in top_chunks})

    # 5. Build prompt
    system_prompt = """Bạn là trợ lý AI thông minh chuyên phân tích tài liệu. 
Trả lời câu hỏi dựa trên ngữ cảnh được cung cấp.
Nếu không tìm thấy thông tin trong ngữ cảnh, hãy nói rõ điều đó.
Trả lời bằng tiếng Việt, rõ ràng và chính xác."""

    user_message = f"""Ngữ cảnh từ tài liệu:
{context}

Câu hỏi: {question}"""

    # Build conversation history
    contents = []
    if chat_history:
        for msg in chat_history[-6:]:  # Last 3 turns
            contents.append(types.Content(
                role=msg["role"],
                parts=[types.Part(text=msg["content"])]
            ))
    contents.append(types.Content(role="user", parts=[types.Part(text=user_message)]))

    # 6. Stream Gemini response
    client = genai.Client(api_key=settings.gemini_api_key)

    # Yield source IDs first as metadata
    yield f"data: {json.dumps({'type': 'sources', 'source_ids': source_ids})}\n\n"

    full_response = ""
    async for chunk in await client.aio.models.generate_content_stream(
        model=settings.chat_model,
        contents=contents,
        config=types.GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=0.3,
        ),
    ):
        if chunk.text:
            full_response += chunk.text
            yield f"data: {json.dumps({'type': 'token', 'content': chunk.text})}\n\n"

    yield f"data: {json.dumps({'type': 'done', 'full_content': full_response})}\n\n"
