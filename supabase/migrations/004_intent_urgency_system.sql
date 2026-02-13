-- ============================================================================
-- Intent & Urgency Extraction System - Database Schema Extensions
-- ============================================================================

-- Add shadow mode columns to category_feedback table
ALTER TABLE category_feedback 
ADD COLUMN IF NOT EXISTS is_shadow BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS ai_confidence FLOAT,
ADD COLUMN IF NOT EXISTS urgency_score INTEGER,
ADD COLUMN IF NOT EXISTS budget_signal VARCHAR(10),
ADD COLUMN IF NOT EXISTS intent_anchors_matched JSONB,
ADD COLUMN IF NOT EXISTS explanation TEXT;

-- Create intent_anchors table for vector similarity matching
CREATE TABLE IF NOT EXISTS intent_anchors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    terms TEXT[] NOT NULL, -- Array of trigger terms
    embedding VECTOR(1536), -- OpenAI embedding-3-small dimension
    priority_weight INTEGER DEFAULT 1, -- Weight for scoring
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on intent_anchors
ALTER TABLE intent_anchors ENABLE ROW LEVEL SECURITY;

-- Allow read access to all (for edge function usage)
CREATE POLICY "Allow read access to intent_anchors"
ON intent_anchors FOR SELECT
TO anon, authenticated
USING (true);

-- Allow insert/update only for service role (edge functions)
CREATE POLICY "Allow service role full access to intent_anchors"
ON intent_anchors FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create category_suggestions table for shadow mode logging
CREATE TABLE IF NOT EXISTS category_suggestions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    seller_id UUID REFERENCES sellers(id) ON DELETE CASCADE,
    conversation_id VARCHAR(255),
    message_text TEXT NOT NULL,
    suggested_category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    ai_confidence FLOAT,
    urgency_score INTEGER,
    budget_signal VARCHAR(10),
    intent_anchors_matched JSONB,
    explanation TEXT,
    is_shadow BOOLEAN DEFAULT TRUE,
    human_selected_category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    is_match BOOLEAN GENERATED ALWAYS AS (
        CASE 
            WHEN human_selected_category_id IS NULL THEN NULL
            WHEN suggested_category_id = human_selected_category_id THEN TRUE
            ELSE FALSE
        END
    ) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on category_suggestions
ALTER TABLE category_suggestions ENABLE ROW LEVEL SECURITY;

-- Allow insert from edge functions
CREATE POLICY "Allow service role insert on category_suggestions"
ON category_suggestions FOR INSERT
TO service_role
WITH CHECK (true);

-- Allow sellers to view their own suggestions
CREATE POLICY "Allow sellers to view own suggestions"
ON category_suggestions FOR SELECT
TO authenticated
USING (seller_id = auth.uid());

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_intent_anchors_updated_at
    BEFORE UPDATE ON intent_anchors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_category_suggestions_updated_at
    BEFORE UPDATE ON category_suggestions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Vector Similarity Search Functions
-- ============================================================================

-- Function to find intent anchors by vector similarity
CREATE OR REPLACE FUNCTION find_intent_anchors_by_similarity(
    p_embedding VECTOR(1536),
    p_threshold FLOAT DEFAULT 0.7,
    p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    description TEXT,
    terms TEXT[],
    confidence FLOAT,
    priority_weight INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ia.id,
        ia.name,
        ia.description,
        ia.terms,
        (1 - (ia.embedding <=> p_embedding))::FLOAT as confidence,
        ia.priority_weight
    FROM intent_anchors ia
    WHERE (1 - (ia.embedding <=> p_embedding)) >= p_threshold
    ORDER BY ia.embedding <=> p_embedding
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to find categories by vector similarity
CREATE OR REPLACE FUNCTION find_categories_by_similarity(
    p_embedding VECTOR(1536),
    p_threshold FLOAT DEFAULT 0.75,
    p_limit INTEGER DEFAULT 1
)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    description TEXT,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.description,
        (1 - (c.embedding <=> p_embedding))::FLOAT as similarity
    FROM categories c
    WHERE (1 - (c.embedding <=> p_embedding)) >= p_threshold
    ORDER BY c.embedding <=> p_embedding
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Seed Intent Anchors
-- ============================================================================

INSERT INTO intent_anchors (name, description, terms, priority_weight) VALUES
('Emergency', 'Urgent situations requiring immediate attention', 
    ARRAY['flood', 'fire', 'leaking', 'now', 'help', 'immediate', 'emergency', 'urgent', 'asap', 'critical', 'disaster'], 3),
('High Budget', 'Customers with premium budget expectations', 
    ARRAY['price no object', 'premium', 'best quality', 'urgent', 'whatever it takes', 'luxury', 'high-end', 'top tier', 'unlimited budget'], 2),
('Medium Budget', 'Standard pricing inquiries', 
    ARRAY['quote', 'price', 'how much', 'cost', 'estimate', 'pricing', 'budget'], 1),
('Low Budget', 'Price-sensitive customers', 
    ARRAY['cheap', 'cheapest', 'discount', 'deal', 'affordable', 'low cost', 'budget-friendly', 'coupon'], 1),
('Planning Phase', 'Future-oriented, non-urgent inquiries', 
    ARRAY['planning', 'future', 'next month', 'eventually', 'someday', 'considering', 'researching'], -1)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Index for shadow mode queries
CREATE INDEX IF NOT EXISTS idx_category_suggestions_shadow 
ON category_suggestions(is_shadow, created_at) 
WHERE is_shadow = true;

-- Index for accuracy tracking
CREATE INDEX IF NOT EXISTS idx_category_suggestions_match 
ON category_suggestions(suggested_category_id, human_selected_category_id, is_match) 
WHERE human_selected_category_id IS NOT NULL;

-- Index for seller lookups
CREATE INDEX IF NOT EXISTS idx_category_suggestions_seller 
ON category_suggestions(seller_id, created_at);

-- ============================================================================
-- Analytics View: Daily AI Accuracy
-- ============================================================================

CREATE OR REPLACE VIEW daily_ai_accuracy AS
SELECT 
    DATE(created_at) as day,
    COUNT(*) as total_feedback,
    COUNT(*) FILTER (WHERE is_match = true) as correct_matches,
    ROUND(
        (COUNT(*) FILTER (WHERE is_match = true)::FLOAT / NULLIF(COUNT(*), 0)) * 100, 
        2
    ) as accuracy_percentage
FROM category_suggestions
WHERE is_shadow = true 
  AND human_selected_category_id IS NOT NULL
GROUP BY DATE(created_at)
ORDER BY day DESC;
