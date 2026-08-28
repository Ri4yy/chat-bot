-- Drop functions that depend on the embedding column
DROP FUNCTION IF EXISTS public.match_documents(vector, integer, uuid);
DROP FUNCTION IF EXISTS public.match_documents(vector, double precision, integer, uuid);

-- Drop the old column and add the new one with 1024 dimensions
ALTER TABLE public.documents DROP COLUMN IF EXISTS embedding;
ALTER TABLE public.documents ADD COLUMN embedding vector(1024);

-- Recreate match_documents functions
CREATE OR REPLACE FUNCTION public.match_documents(
  query_embedding vector(1024),
  match_count integer DEFAULT NULL::integer,
  filter_project_id uuid DEFAULT NULL::uuid
)
RETURNS TABLE(
  id uuid,
  project_id uuid,
  content text,
  metadata jsonb,
  similarity double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    documents.id,
    documents.project_id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) AS similarity
  FROM documents
  WHERE documents.project_id = filter_project_id
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.match_documents(
  query_embedding vector(1024),
  match_threshold double precision DEFAULT 0.0,
  match_count integer DEFAULT NULL::integer,
  filter_project_id uuid DEFAULT NULL::uuid
)
RETURNS TABLE(
  id uuid,
  project_id uuid,
  content text,
  metadata jsonb,
  similarity double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    documents.id,
    documents.project_id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) AS similarity
  FROM documents
  WHERE documents.project_id = filter_project_id
    AND 1 - (documents.embedding <=> query_embedding) > match_threshold
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
