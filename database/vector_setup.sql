-- ============================================================================
-- SMART THEME PARK OPERATIONS AND PERSONALIZED VISITOR EXPERIENCE SYSTEM
-- Vector Database Setup & Semantic Similarity Search (PostgreSQL + pgvector)
-- Course: DBMS Experiential Learning - Level 3 Project
-- ============================================================================

-- 1. Enable the pgvector extension in PostgreSQL
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Ensure attraction table contains the vector embedding column (384 dimensions)
-- Note: 384 dimensions matches standard sentence-transformers (all-MiniLM-L6-v2)
ALTER TABLE attractions 
ADD COLUMN IF NOT EXISTS embedding vector(384);

-- 3. Create HNSW (Hierarchical Navigable Small World) index for ultra-fast ANN search
-- Using vector_cosine_ops for Cosine Distance calculations (<=>)
CREATE INDEX IF NOT EXISTS idx_attractions_vector_hnsw 
ON attractions 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- ----------------------------------------------------------------------------
-- 4. STORED PROCEDURE / FUNCTION FOR PERSONALIZED ATTRACTION RETRIEVAL
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_recommend_personalized_attractions(
    p_visitor_query_embedding vector(384),
    p_max_results INT DEFAULT 4,
    p_preferred_thrill VARCHAR(20) DEFAULT NULL
)
RETURNS TABLE (
    attraction_id INT,
    attraction_name VARCHAR(100),
    zone_name VARCHAR(80),
    thrill_level VARCHAR(20),
    current_wait_time INT,
    rating NUMERIC(2, 1),
    description TEXT,
    similarity_score NUMERIC(5, 4)
)
LANGUAGE sql
AS $$
    SELECT 
        a.attraction_id,
        a.name AS attraction_name,
        pz.zone_name,
        a.thrill_level,
        a.current_wait_time,
        a.rating,
        a.description,
        ROUND((1 - (a.embedding <=> p_visitor_query_embedding))::NUMERIC, 4) AS similarity_score
    FROM attractions a
    JOIN park_zones pz ON a.zone_id = pz.zone_id
    WHERE a.status = 'OPERATIONAL'
      AND (p_preferred_thrill IS NULL OR a.thrill_level = p_preferred_thrill)
    ORDER BY a.embedding <=> p_visitor_query_embedding ASC
    LIMIT p_max_results;
$$;
