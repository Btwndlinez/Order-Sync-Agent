-- Antigravity High-Velocity Infrastructure Initialization
-- Run this in the Supabase SQL Editor

-- 1. EXTENSIONS: Enable high-speed search and UUIDs
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. SELLERS: The core shop link
CREATE TABLE IF NOT EXISTS sellers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  shopify_domain TEXT UNIQUE,
  shopify_access_token TEXT, -- Recommend encrypting at the app level
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CONVERSATIONS: Optimized for "Ghost-Reader" upserts
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES sellers(id) ON DELETE CASCADE,
  messenger_conversation_id TEXT UNIQUE, -- Prevents duplicates from Ghost-Reader
  buyer_name TEXT,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb, 
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CHECKOUT SUGGESTIONS: The "Pre-flight" data
CREATE TABLE IF NOT EXISTS checkout_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  variant_id TEXT,
  product_title TEXT NOT NULL,
  variant_title TEXT,
  quantity INTEGER DEFAULT 1,
  total_value DECIMAL(10,2),
  confidence_score DECIMAL(3,2),
  trigger_message TEXT,
  embedding vector(1536), -- For high-speed semantic matching
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. GENERATED CHECKOUTS: The "Completed Actions"
CREATE TABLE IF NOT EXISTS generated_checkouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES sellers(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  shopify_draft_order_id TEXT UNIQUE NOT NULL,
  checkout_url TEXT NOT NULL,
  total_value DECIMAL(10,2),
  status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'expired'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. WAITLIST: For Lead Generation
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  positioning_angle TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. INDEXES: The "No-Lag" search optimizations
CREATE INDEX IF NOT EXISTS idx_conv_messenger_id ON conversations(messenger_conversation_id);
-- Note: ivfflat index creation might fail if the table is empty or too small, 
-- but it's good for the schema definition.
CREATE INDEX IF NOT EXISTS idx_suggestions_embedding ON checkout_suggestions USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_checkouts_seller_status ON generated_checkouts(seller_id, status);

-- 7. RLS POLICIES: Security without friction
ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkout_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_checkouts ENABLE ROW LEVEL SECURITY;

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to allow re-running the script
DO $$
BEGIN
    DROP POLICY IF EXISTS "Sellers can manage their own profile" ON sellers;
    DROP POLICY IF EXISTS "Sellers can manage their conversations" ON conversations;
    DROP POLICY IF EXISTS "Sellers can manage their suggestions" ON checkout_suggestions;
    DROP POLICY IF EXISTS "Sellers can manage their checkouts" ON generated_checkouts;
    DROP POLICY IF EXISTS "Anyone can join the waitlist" ON waitlist;
END $$;

CREATE POLICY "Anyone can join the waitlist" ON waitlist FOR INSERT WITH CHECK (true);

CREATE POLICY "Sellers can manage their own profile" ON sellers FOR ALL USING (auth.uid() = id);
CREATE POLICY "Sellers can manage their conversations" ON conversations FOR ALL USING (seller_id = auth.uid());
CREATE POLICY "Sellers can manage their suggestions" ON checkout_suggestions FOR ALL USING (
  conversation_id IN (SELECT id FROM conversations WHERE seller_id = auth.uid())
);
CREATE POLICY "Sellers can manage their checkouts" ON generated_checkouts FOR ALL USING (seller_id = auth.uid());

-- 8. PRODUCTS: Hybrid Product Catalog (Manual, CSV, Shopify)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES sellers(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('manual', 'csv', 'shopify')),
  external_id TEXT, -- e.g., Shopify Variant ID
  name TEXT NOT NULL,
  sku TEXT NOT NULL,
  price DECIMAL(10,2),
  attributes JSONB DEFAULT '{}'::jsonb, -- For sizes, colors, etc.
  search_string TEXT, -- Concatenated name + sku + attributes for fuzzy matching
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(seller_id, sku)
);

-- 9. PRODUCT VARIANTS: For products with multiple options
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  external_id TEXT, -- e.g., Shopify Variant ID
  sku TEXT NOT NULL,
  price DECIMAL(10,2),
  options JSONB DEFAULT '[]'::jsonb, -- [{ name: "Size", value: "Large" }]
  inventory_quantity INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. PRODUCT IMPORT JOBS: Track CSV/Shopify import status
CREATE TABLE IF NOT EXISTS product_import_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES sellers(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('csv', 'shopify')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  total_rows INTEGER DEFAULT 0,
  processed_rows INTEGER DEFAULT 0,
  failed_rows INTEGER DEFAULT 0,
  error_log JSONB DEFAULT '[]'::jsonb,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. INDEXES: Product search optimizations
CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_source ON products(source);
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING gin(to_tsvector('english', search_string));
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);

-- 12. RLS POLICIES: Product security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_import_jobs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Sellers can manage their products" ON products;
    DROP POLICY IF EXISTS "Sellers can manage their variants" ON product_variants;
    DROP POLICY IF EXISTS "Sellers can manage their import jobs" ON product_import_jobs;
END $$;

CREATE POLICY "Sellers can manage their products" ON products FOR ALL USING (seller_id = auth.uid());
CREATE POLICY "Sellers can manage their variants" ON product_variants FOR ALL USING (
  product_id IN (SELECT id FROM products WHERE seller_id = auth.uid())
);
CREATE POLICY "Sellers can manage their import jobs" ON product_import_jobs FOR ALL USING (seller_id = auth.uid());

-- 13. VECTOR SEARCH FUNCTION
CREATE OR REPLACE FUNCTION match_products (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id UUID,
  product_title TEXT,
  variant_id TEXT,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cs.id,
    cs.product_title,
    cs.variant_id,
    1 - (cs.embedding <=> query_embedding) AS similarity
  FROM checkout_suggestions cs
  WHERE 1 - (cs.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
