-- Antigravity Product Matcher Database Schema
-- Phase 1: Core tables for Order Sync Agent

-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- 1. SELLERS TABLE
-- Stores seller/merchant information
-- ============================================
CREATE TABLE IF NOT EXISTS sellers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shopify_domain TEXT UNIQUE NOT NULL,
    shopify_access_token TEXT,
    email TEXT UNIQUE,
    business_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- RLS: Sellers can only see their own data
ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view own data" ON sellers
    FOR ALL
    USING (auth.uid() = id);

-- ============================================
-- 2. PRODUCTS TABLE (Antigravity Matcher)
-- Synced from Shopify for fast local matching
-- ============================================
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,  -- Shopify product ID
    seller_id UUID REFERENCES sellers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    product_type TEXT,
    tags TEXT[],
    vendor TEXT,
    status TEXT DEFAULT 'active',
    price DECIMAL(10,2),
    compare_at_price DECIMAL(10,2),
    image_url TEXT,
    images JSONB DEFAULT '[]',
    variants JSONB DEFAULT '[]',
    -- Vector embedding for semantic search (1536 dimensions for OpenAI)
    embedding VECTOR(1536),
    -- Metadata for quick matching
    search_text TEXT GENERATED ALWAYS AS (
        COALESCE(title, '') || ' ' || 
        COALESCE(description, '') || ' ' ||
        COALESCE(product_type, '') || ' ' ||
        COALESCE(array_to_string(tags, ' '), '') || ' ' ||
        COALESCE(vendor, '')
    ) STORED,
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_product_id CHECK (id ~ '^[0-9]+$')
);

-- Indexes for performance
CREATE INDEX idx_products_seller ON products(seller_id);
CREATE INDEX idx_products_status ON products(status) WHERE status = 'active';
CREATE INDEX idx_products_search ON products USING GIN (to_tsvector('english', search_text));
CREATE INDEX idx_products_type ON products(product_type);

-- Vector similarity index (IVFFlat for cosine similarity)
CREATE INDEX idx_products_embedding ON products 
USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

-- RLS: Sellers can only see their own products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view own products" ON products
    FOR ALL
    USING (seller_id = auth.uid());

-- ============================================
-- 3. CONVERSATIONS TABLE
-- Stores messenger conversation history
-- ============================================
CREATE TABLE IF NOT EXISTS conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    seller_id UUID REFERENCES sellers(id) ON DELETE CASCADE,
    messenger_id TEXT NOT NULL,  -- Facebook/Messenger conversation ID
    customer_name TEXT,
    customer_email TEXT,
    messages JSONB DEFAULT '[]',  -- Array of {text, sender, timestamp}
    intent_detected BOOLEAN DEFAULT false,
    detected_product_id TEXT REFERENCES products(id),
    detected_variant_id TEXT,
    confidence_score DECIMAL(3,2),
    trigger_message TEXT,
    analysis_result JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(seller_id, messenger_id)
);

CREATE INDEX idx_conversations_seller ON conversations(seller_id);
CREATE INDEX idx_conversations_messenger ON conversations(messenger_id);
CREATE INDEX idx_conversations_intent ON conversations(seller_id, intent_detected) WHERE intent_detected = true;

-- RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view own conversations" ON conversations
    FOR ALL
    USING (seller_id = auth.uid());

-- ============================================
-- 4. GENERATED_CHECKOUTS TABLE
-- Tracks all created draft orders
-- ============================================
CREATE TABLE IF NOT EXISTS generated_checkouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    seller_id UUID REFERENCES sellers(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    product_id TEXT REFERENCES products(id),
    variant_id TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    
    -- Shopify data
    shopify_draft_order_id TEXT,
    shopify_draft_order_name TEXT,
    checkout_url TEXT NOT NULL,
    
    -- Status tracking
    status TEXT DEFAULT 'pending',  -- pending, sent, clicked, converted, expired
    sent_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    converted_at TIMESTAMP WITH TIME ZONE,
    
    -- Customer info (captured at creation time)
    customer_email TEXT,
    customer_name TEXT,
    
    -- Pricing at time of creation
    unit_price DECIMAL(10,2),
    total_price DECIMAL(10,2),
    currency TEXT DEFAULT 'USD',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

CREATE INDEX idx_checkouts_seller ON generated_checkouts(seller_id);
CREATE INDEX idx_checkouts_conversation ON generated_checkouts(conversation_id);
CREATE INDEX idx_checkouts_status ON generated_checkouts(status);
CREATE INDEX idx_checkouts_created ON generated_checkouts(created_at DESC);

-- RLS
ALTER TABLE generated_checkouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view own checkouts" ON generated_checkouts
    FOR ALL
    USING (seller_id = auth.uid());

-- ============================================
-- 5. CHECKOUT_SUGGESTIONS TABLE (Deprecated - use conversations instead)
-- Kept for backward compatibility if needed
-- ============================================
-- This table is superseded by the 'conversations' table with intent_detected=true

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to find matching products using fuzzy search
CREATE OR REPLACE FUNCTION find_matching_products(
    p_seller_id UUID,
    p_search_term TEXT,
    p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
    id TEXT,
    title TEXT,
    variant_id TEXT,
    variant_title TEXT,
    price DECIMAL,
    image_url TEXT,
    similarity_score FLOAT
) AS $$
BEGIN
    RETURN QUERY
    WITH ranked_products AS (
        SELECT 
            p.id,
            p.title,
            jsonb_array_elements(p.variants)->>'id' as variant_id,
            COALESCE(jsonb_array_elements(p.variants)->>'title', 'Default') as variant_title,
            COALESCE(
                (jsonb_array_elements(p.variants)->>'price')::DECIMAL,
                p.price
            ) as price,
            p.image_url,
            -- Combine text search with trigram similarity
            (
                ts_rank(to_tsvector('english', p.search_text), plainto_tsquery('english', p_search_term)) * 0.5 +
                similarity(p.search_text, p_search_term) * 0.5
            )::FLOAT as similarity_score
        FROM products p
        WHERE p.seller_id = p_seller_id
            AND p.status = 'active'
            AND (
                p.search_text @@ plainto_tsquery('english', p_search_term)
                OR p.search_text % p_search_term
            )
    )
    SELECT * FROM ranked_products
    ORDER BY similarity_score DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to find products by vector similarity (semantic search)
CREATE OR REPLACE FUNCTION find_products_by_semantic_similarity(
    p_seller_id UUID,
    p_embedding VECTOR(1536),
    p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
    id TEXT,
    title TEXT,
    description TEXT,
    price DECIMAL,
    image_url TEXT,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.description,
        p.price,
        p.image_url,
        (1 - (p.embedding <=> p_embedding))::FLOAT as similarity
    FROM products p
    WHERE p.seller_id = p_seller_id
        AND p.status = 'active'
        AND p.embedding IS NOT NULL
    ORDER BY p.embedding <=> p_embedding
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to sync product from Shopify webhook
CREATE OR REPLACE FUNCTION sync_product_from_shopify()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_synced_at = NOW();
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_product
    BEFORE INSERT OR UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION sync_product_from_shopify();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp triggers
CREATE TRIGGER update_sellers_updated_at BEFORE UPDATE ON sellers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ENABLE REALTIME (for live updates)
-- ============================================

-- Enable realtime for conversations
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- Enable realtime for generated_checkouts
ALTER PUBLICATION supabase_realtime ADD TABLE generated_checkouts;

-- ============================================
-- SEED DATA (for testing)
-- ============================================

-- Example: Insert test seller (replace with real data)
-- INSERT INTO sellers (shopify_domain, email, business_name)
-- VALUES ('your-store.myshopify.com', 'you@example.com', 'Your Store');

-- Example: Insert test products (these would come from Shopify sync)
-- INSERT INTO products (id, seller_id, title, description, price, variants)
-- VALUES (
--     '1234567890',
--     (SELECT id FROM sellers LIMIT 1),
--     'Black Hoodie',
--     'Premium cotton black hoodie, perfect for casual wear',
--     49.99,
--     '[{"id": "12345678901", "title": "Small", "price": "49.99"}, {"id": "12345678902", "title": "Medium", "price": "49.99"}]'::jsonb
-- );
