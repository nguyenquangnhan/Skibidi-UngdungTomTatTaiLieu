"""
Neo4j Service
- CRUD operations for Chunks, Entities, Relationships
- Knowledge Graph extraction via Gemini structured output
- Vector index initialization
"""
import json
from neo4j import AsyncGraphDatabase
from google import genai
from google.genai import types

from app.config import get_settings

settings = get_settings()

_driver = None


def get_neo4j_driver():
    global _driver
    if _driver is None:
        _driver = AsyncGraphDatabase.driver(
            settings.neo4j_uri,
            auth=(settings.neo4j_username, settings.neo4j_password),
        )
    return _driver


async def close_neo4j_driver():
    global _driver
    if _driver:
        await _driver.close()
        _driver = None


async def init_vector_index():
    """Create vector index if not exists."""
    driver = get_neo4j_driver()
    try:
        async with driver.session() as session:
            result = await session.run("SHOW INDEXES YIELD name WHERE name = 'chunk_vector_index'")
            record = await result.single()
            if not record:
                try:
                    await session.run("""
                        CALL db.index.vector.createNodeIndex('chunk_vector_index', 'Chunk', 'embedding', 768, 'cosine')
                    """)
                except Exception:
                    await session.run("""
                        CREATE VECTOR INDEX chunk_vector_index IF NOT EXISTS
                        FOR (c:Chunk) ON (c.embedding)
                        OPTIONS {indexConfig: {
                            `vector.dimensions`: 768,
                            `vector.similarity_function`: 'cosine'
                        }}
                    """)
    except Exception as e:
        print(f"Vector index initialization check: {e}")


async def store_chunks(source_id: str, notebook_id: str, chunks: list[dict]):
    """Store text chunks with embeddings in Neo4j."""
    driver = get_neo4j_driver()
    async with driver.session() as session:
        # Ensure Source and Notebook nodes exist
        await session.run(
            "MERGE (n:Notebook {id: $notebook_id})",
            notebook_id=notebook_id,
        )
        await session.run(
            "MERGE (s:Source {id: $source_id}) SET s.notebook_id = $notebook_id",
            source_id=source_id, notebook_id=notebook_id,
        )
        await session.run(
            "MATCH (s:Source {id: $source_id}), (n:Notebook {id: $notebook_id}) "
            "MERGE (s)-[:BELONGS_TO]->(n)",
            source_id=source_id, notebook_id=notebook_id,
        )
        # Store chunks
        for chunk in chunks:
            await session.run("""
                MERGE (c:Chunk {id: $chunk_id})
                SET c.text = $text,
                    c.source_id = $source_id,
                    c.chunk_index = $chunk_index,
                    c.embedding = $embedding
                WITH c
                MATCH (s:Source {id: $source_id})
                MERGE (c)-[:PART_OF]->(s)
            """, **chunk)


async def vector_search(notebook_id: str, query_embedding: list[float], top_k: int = 5) -> list[dict]:
    """Vector similarity search on chunks belonging to a notebook."""
    driver = get_neo4j_driver()
    async with driver.session() as session:
        result = await session.run("""
            CALL db.index.vector.queryNodes('chunk_vector_index', $top_k, $embedding)
            YIELD node AS c, score
            MATCH (c)-[:PART_OF]->(s:Source)-[:BELONGS_TO]->(n:Notebook {id: $notebook_id})
            RETURN c.id AS chunk_id, c.text AS text, c.source_id AS source_id, score
            ORDER BY score DESC
        """, embedding=query_embedding, top_k=top_k, notebook_id=notebook_id)
        return [dict(record) async for record in result]


async def get_related_entities(chunk_ids: list[str]) -> list[dict]:
    """Get entities and relationships linked to given chunks."""
    driver = get_neo4j_driver()
    async with driver.session() as session:
        result = await session.run("""
            MATCH (e)-[:MENTIONED_IN]->(c:Chunk)
            WHERE c.id IN $chunk_ids
            OPTIONAL MATCH (e)-[r]->(e2)
            WHERE NOT type(r) = 'MENTIONED_IN'
            RETURN e.name AS entity, e.type AS entity_type,
                   type(r) AS relation, e2.name AS target
        """, chunk_ids=chunk_ids)
        return [dict(record) async for record in result]


async def extract_and_store_knowledge_graph(source_id: str, text: str):
    """Use Gemini to extract entities/relations and store in Neo4j."""
    client = genai.Client(api_key=settings.gemini_api_key)

    prompt = f"""Từ đoạn văn bản sau, hãy trích xuất các thực thể (entities) và quan hệ (relationships).
Trả về JSON với format:
{{
  "entities": [{{"name": "...", "type": "Person|Organization|Concept|Location|Event|Other"}}],
  "relationships": [{{"source": "entity_name", "relation": "RELATION_TYPE", "target": "entity_name"}}]
}}

Văn bản:
{text[:4000]}

Chỉ trả về JSON, không có text khác."""

    response = client.models.generate_content(
        model=settings.chat_model,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
        ),
    )

    try:
        kg_data = json.loads(response.text)
    except json.JSONDecodeError:
        return  # Skip if parsing fails

    driver = get_neo4j_driver()
    async with driver.session() as session:
        # Create entity nodes and link to chunks
        for entity in kg_data.get("entities", []):
            label = entity.get("type", "Entity").replace("/", "_").replace(" ", "_")
            name = entity.get("name", "").strip()
            if not name:
                continue
            await session.run(
                f"MERGE (e:{label} {{name: $name}}) SET e.type = $type",
                name=name, type=entity.get("type", "Entity"),
            )
            # Link entity to chunks of this source where it is mentioned
            await session.run("""
                MATCH (c:Chunk)-[:PART_OF]->(s:Source {id: $source_id})
                WHERE toLower(c.text) CONTAINS toLower($name)
                WITH c
                MATCH (e {name: $name})
                MERGE (e)-[:MENTIONED_IN]->(c)
            """, source_id=source_id, name=name)

            # Fallback: if not matched textually in chunks, link to at least one chunk of this source
            await session.run("""
                MATCH (c:Chunk)-[:PART_OF]->(s:Source {id: $source_id})
                WITH c LIMIT 1
                MATCH (e {name: $name})
                WHERE NOT (e)-[:MENTIONED_IN]->(:Chunk)-[:PART_OF]->(:Source {id: $source_id})
                MERGE (e)-[:MENTIONED_IN]->(c)
            """, source_id=source_id, name=name)

        # Create relationships
        for rel in kg_data.get("relationships", []):
            rel_type = rel.get("relation", "RELATED_TO").upper().replace(" ", "_").replace("-", "_")
            await session.run(f"""
                MATCH (a {{name: $source}}), (b {{name: $target}})
                MERGE (a)-[:{rel_type}]->(b)
            """, source=rel["source"], target=rel["target"])


async def get_graph_data(notebook_id: str) -> dict:
    """Get all nodes and edges for Knowledge Graph visualization."""
    driver = get_neo4j_driver()
    async with driver.session() as session:
        # Get entities linked to chunks in this notebook
        nodes_result = await session.run("""
            MATCH (c:Chunk)-[:PART_OF]->(:Source)-[:BELONGS_TO]->(n:Notebook {id: $notebook_id})
            MATCH (e)-[:MENTIONED_IN]->(c)
            RETURN DISTINCT e.name AS name, e.type AS type, labels(e)[0] AS label
        """, notebook_id=notebook_id)
        nodes = [{"id": r["name"], "label": r["name"], "type": r["type"] or r["label"]}
                 async for r in nodes_result]

        # Get relationships between those entities
        edges_result = await session.run("""
            MATCH (c:Chunk)-[:PART_OF]->(:Source)-[:BELONGS_TO]->(n:Notebook {id: $notebook_id})
            MATCH (e)-[:MENTIONED_IN]->(c)
            MATCH (e)-[r]->(e2)-[:MENTIONED_IN]->(c2)-[:PART_OF]->(:Source)-[:BELONGS_TO]->(n)
            WHERE NOT type(r) = 'MENTIONED_IN'
            RETURN DISTINCT e.name AS source, type(r) AS relation, e2.name AS target
        """, notebook_id=notebook_id)
        edges = [{"source": r["source"], "target": r["target"], "label": r["relation"]}
                 async for r in edges_result]

    return {"nodes": nodes, "edges": edges}


async def delete_source_data(source_id: str):
    """Remove all chunks and entity links for a source."""
    driver = get_neo4j_driver()
    async with driver.session() as session:
        await session.run("""
            MATCH (c:Chunk)-[:PART_OF]->(s:Source {id: $source_id})
            DETACH DELETE c
        """, source_id=source_id)
        await session.run("MATCH (s:Source {id: $source_id}) DETACH DELETE s", source_id=source_id)
