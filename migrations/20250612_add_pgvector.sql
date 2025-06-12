-- See CHANGELOG.md for 2025-06-12 [Added]
-- Adds PGVector extension and content_items table

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS content_items (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id),
  external_id text NOT NULL,
  content_type text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  url text NOT NULL,
  engagement_score integer NOT NULL,
  embedding vector(1536),
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL,
  metadata jsonb DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS content_items_user_id_idx ON content_items(user_id);
CREATE INDEX IF NOT EXISTS content_items_content_type_idx ON content_items(content_type);
CREATE INDEX IF NOT EXISTS content_items_external_id_idx ON content_items(external_id);
