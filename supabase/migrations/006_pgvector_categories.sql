-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Categories table with embedding column
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES categories(id),
  description TEXT,
  keywords TEXT[],
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- GIN index for optimized cosine similarity search
CREATE INDEX IF NOT EXISTS categories_embedding_idx 
ON categories 
USING gin (embedding vector_cosine_ops);

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Allow public read access for classification
CREATE POLICY "Allow public read for classification"
ON categories FOR SELECT
TO anon, authenticated
USING (true);

-- Seed default commerce categories
INSERT INTO categories (name, parent_id, description, keywords, embedding) VALUES
-- Root
('Commerce', NULL, 'E-commerce and sales related', ARRAY['commerce', 'sales', 'buy', 'purchase'], '[]'),
-- Pre-Sale
('Product Inquiry', (SELECT id FROM categories WHERE name = 'Commerce' LIMIT 1), 'Questions about products', ARRAY['price', 'available', 'size', 'color', 'stock'], '[]'),
('Quote Request', (SELECT id FROM categories WHERE name = 'Commerce' LIMIT 1), 'Requests for quotes', ARRAY['quote', 'estimate', 'pricing', 'cost'], '[]'),
('Order Intent', (SELECT id FROM categories WHERE name = 'Commerce' LIMIT 1), 'Intent to purchase', ARRAY['buy', 'order', 'purchase', 'want', 'need'], '[]'),
-- Post-Sale
('Order Status', (SELECT id FROM categories WHERE name = 'Commerce' LIMIT 1), 'Order tracking and status', ARRAY['order status', 'tracking', 'where is', 'when will'], '[]'),
('Shipping Issue', (SELECT id FROM categories WHERE name = 'Commerce' LIMIT 1), 'Shipping problems', ARRAY['shipping', 'delivery', 'arrived', 'late'], '[]'),
('Returns & Refunds', (SELECT id FROM categories WHERE name = 'Commerce' LIMIT 1), 'Return or refund requests', ARRAY['return', 'refund', 'exchange', 'cancel'], '[]'),
-- Support
('Technical Support', NULL, 'Technical assistance', ARRAY['help', 'not working', 'error', 'bug', 'issue'], '[]'),
('Account', NULL, 'Account related', ARRAY['account', 'login', 'password', 'profile'], '[]')
ON CONFLICT DO NOTHING;

-- RPC function for cosine similarity search
CREATE OR REPLACE FUNCTION match_categories(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 3
)
RETURNS TABLE (
  id uuid,
  name text,
  parent_id uuid,
  description text,
  keywords text[],
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.name,
    c.parent_id,
    c.description,
    c.keywords,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM categories c
  WHERE c.embedding IS NOT NULL
    AND 1 - (c.embedding <=> query_embedding) > match_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to update embeddings in bulk
CREATE OR REPLACE FUNCTION update_category_embeddings()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  cat_record RECORD;
BEGIN
  FOR cat_record IN SELECT id, name, description, keywords FROM categories LOOP
    -- Placeholder: In production, call OpenAI/Gemini API here
    -- For now, skip since we can't call external APIs from SQL
    NULL;
  END LOOP;
END;
$$;
