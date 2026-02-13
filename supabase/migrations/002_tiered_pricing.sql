-- OrderSync Tiered Pricing Schema Migration
-- Adds usage tracking and plan limits for Revenue Wedge

-- ============================================
-- 1. PRICING TIERS TYPE
-- ============================================
CREATE TYPE plan_type AS ENUM ('starter', 'pro', 'scale');

-- ============================================
-- 2. UPDATE SELLERS TABLE
-- ============================================
-- Add plan and usage columns to sellers table
ALTER TABLE sellers 
ADD COLUMN IF NOT EXISTS plan plan_type DEFAULT 'starter',
ADD COLUMN IF NOT EXISTS links_generated_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS usage_period_start DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Create index for plan lookups
CREATE INDEX IF NOT EXISTS idx_sellers_plan ON sellers(plan);
CREATE INDEX IF NOT EXISTS idx_sellers_usage_period ON sellers(usage_period_start);

-- ============================================
-- 3. USAGE TRACKING TABLE
-- ============================================
-- Detailed usage log for audit and analytics
CREATE TABLE IF NOT EXISTS usage_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    seller_id UUID REFERENCES sellers(id) ON DELETE CASCADE,
    action TEXT NOT NULL,  -- 'checkout_created', 'limit_reached', etc.
    plan plan_type NOT NULL,
    count_before INTEGER,
    count_after INTEGER,
    limit INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_usage_logs_seller ON usage_logs(seller_id);
CREATE INDEX idx_usage_logs_created ON usage_logs(created_at DESC);

-- RLS
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view own usage logs" ON usage_logs
    FOR ALL
    USING (seller_id = auth.uid());

-- ============================================
-- 4. PRICING CONFIGURATION
-- ============================================
-- Store pricing tier configuration
CREATE TABLE IF NOT EXISTS pricing_tiers (
    plan plan_type PRIMARY KEY,
    display_name TEXT NOT NULL,
    monthly_limit INTEGER NOT NULL,
    stripe_price_id TEXT,
    monthly_price DECIMAL(10,2),
    features JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default pricing tiers
INSERT INTO pricing_tiers (plan, display_name, monthly_limit, monthly_price, features)
VALUES 
    ('starter', 'Starter', 20, 19.00, '["20 links/month", "Basic analytics", "Email support"]'::jsonb),
    ('pro', 'Pro', 200, 49.00, '["200 links/month", "Advanced analytics", "Priority support", "API access"]'::jsonb),
    ('scale', 'Scale', 1000, 149.00, '["1000 links/month", "Premium analytics", "24/7 support", "API access", "Custom integrations"]'::jsonb)
ON CONFLICT (plan) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    monthly_limit = EXCLUDED.monthly_limit,
    monthly_price = EXCLUDED.monthly_price,
    features = EXCLUDED.features;

-- ============================================
-- 5. USAGE GATE FUNCTIONS
-- ============================================

-- Function to get user's current usage and limit
CREATE OR REPLACE FUNCTION get_usage_status(p_seller_id UUID)
RETURNS TABLE (
    plan plan_type,
    links_used INTEGER,
    links_limit INTEGER,
    links_remaining INTEGER,
    usage_period_start DATE,
    can_create_link BOOLEAN
) AS $$
DECLARE
    v_plan plan_type;
    v_count INTEGER;
    v_limit INTEGER;
    v_period_start DATE;
BEGIN
    -- Get current seller data
    SELECT s.plan, s.links_generated_count, s.usage_period_start
    INTO v_plan, v_count, v_period_start
    FROM sellers s
    WHERE s.id = p_seller_id;
    
    -- Get limit for plan
    SELECT pt.monthly_limit INTO v_limit
    FROM pricing_tiers pt
    WHERE pt.plan = v_plan;
    
    -- Return usage status
    RETURN QUERY
    SELECT 
        v_plan as plan,
        v_count as links_used,
        v_limit as links_limit,
        GREATEST(0, v_limit - v_count) as links_remaining,
        v_period_start as usage_period_start,
        (v_count < v_limit) as can_create_link;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can create a checkout
CREATE OR REPLACE FUNCTION can_create_checkout(p_seller_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_count INTEGER;
    v_limit INTEGER;
BEGIN
    SELECT s.links_generated_count, pt.monthly_limit
    INTO v_count, v_limit
    FROM sellers s
    JOIN pricing_tiers pt ON s.plan = pt.plan
    WHERE s.id = p_seller_id;
    
    RETURN v_count < v_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment usage counter
CREATE OR REPLACE FUNCTION increment_usage(
    p_seller_id UUID,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS TABLE (
    new_count INTEGER,
    limit INTEGER,
    remaining INTEGER
) AS $$
DECLARE
    v_plan plan_type;
    v_old_count INTEGER;
    v_new_count INTEGER;
    v_limit INTEGER;
BEGIN
    -- Get current values
    SELECT s.plan, s.links_generated_count
    INTO v_plan, v_old_count
    FROM sellers s
    WHERE s.id = p_seller_id
    FOR UPDATE;
    
    -- Get limit
    SELECT pt.monthly_limit INTO v_limit
    FROM pricing_tiers pt
    WHERE pt.plan = v_plan;
    
    -- Check if already at limit
    IF v_old_count >= v_limit THEN
        RAISE EXCEPTION 'Usage limit exceeded for plan %', v_plan;
    END IF;
    
    -- Increment counter
    UPDATE sellers 
    SET links_generated_count = links_generated_count + 1
    WHERE id = p_seller_id
    RETURNING links_generated_count INTO v_new_count;
    
    -- Log the usage
    INSERT INTO usage_logs (
        seller_id, action, plan, count_before, count_after, 
        limit, metadata
    ) VALUES (
        p_seller_id, 'checkout_created', v_plan, 
        v_old_count, v_new_count, v_limit, p_metadata
    );
    
    -- Return updated status
    RETURN QUERY
    SELECT v_new_count, v_limit, (v_limit - v_new_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset usage counters (run monthly via cron/job)
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS INTEGER AS $$
DECLARE
    v_reset_count INTEGER;
BEGIN
    -- Log resets before clearing
    INSERT INTO usage_logs (seller_id, action, plan, count_before, count_after, limit, metadata)
    SELECT 
        id, 
        'usage_reset', 
        plan, 
        links_generated_count, 
        0, 
        (SELECT monthly_limit FROM pricing_tiers WHERE plan = sellers.plan),
        jsonb_build_object('reason', 'monthly_reset', 'period_start', usage_period_start)
    FROM sellers
    WHERE links_generated_count > 0;
    
    -- Reset counters and update period
    UPDATE sellers 
    SET 
        links_generated_count = 0,
        usage_period_start = CURRENT_DATE
    WHERE usage_period_start < DATE_TRUNC('month', CURRENT_DATE);
    
    GET DIAGNOSTICS v_reset_count = ROW_COUNT;
    
    RETURN v_reset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to upgrade/downgrade plan
CREATE OR REPLACE FUNCTION update_seller_plan(
    p_seller_id UUID,
    p_new_plan plan_type,
    p_stripe_subscription_id TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_old_plan plan_type;
BEGIN
    -- Get old plan
    SELECT plan INTO v_old_plan
    FROM sellers
    WHERE id = p_seller_id;
    
    -- Update plan
    UPDATE sellers 
    SET 
        plan = p_new_plan,
        stripe_subscription_id = COALESCE(p_stripe_subscription_id, stripe_subscription_id),
        updated_at = NOW()
    WHERE id = p_seller_id;
    
    -- Log the change
    INSERT INTO usage_logs (
        seller_id, action, plan, count_before, count_after, 
        limit, metadata
    ) VALUES (
        p_seller_id, 
        'plan_change', 
        p_new_plan, 
        (SELECT links_generated_count FROM sellers WHERE id = p_seller_id),
        (SELECT links_generated_count FROM sellers WHERE id = p_seller_id),
        (SELECT monthly_limit FROM pricing_tiers WHERE plan = p_new_plan),
        jsonb_build_object('old_plan', v_old_plan, 'new_plan', p_new_plan)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. TRIGGERS
-- ============================================

-- Update timestamp on pricing_tiers
CREATE TRIGGER update_pricing_tiers_updated_at 
BEFORE UPDATE ON pricing_tiers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. ENABLE REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE usage_logs;

-- ============================================
-- 8. VIEWS FOR ANALYTICS
-- ============================================

-- View: Current usage summary for all sellers
CREATE OR REPLACE VIEW seller_usage_summary AS
SELECT 
    s.id as seller_id,
    s.email,
    s.business_name,
    s.plan,
    s.links_generated_count as links_used,
    pt.monthly_limit as links_limit,
    GREATEST(0, pt.monthly_limit - s.links_generated_count) as links_remaining,
    s.usage_period_start,
    ROUND((s.links_generated_count::DECIMAL / NULLIF(pt.monthly_limit, 0) * 100), 2) as usage_percentage,
    s.stripe_customer_id,
    s.stripe_subscription_id
FROM sellers s
JOIN pricing_tiers pt ON s.plan = pt.plan;

-- View: Usage trends by day
CREATE OR REPLACE VIEW daily_usage_trends AS
SELECT 
    DATE(created_at) as date,
    plan,
    COUNT(*) as checkouts_created,
    COUNT(DISTINCT seller_id) as active_sellers
FROM usage_logs
WHERE action = 'checkout_created'
GROUP BY DATE(created_at), plan
ORDER BY date DESC;

-- ============================================
-- 9. COMMENTS
-- ============================================
COMMENT ON TABLE sellers IS 'Extended with plan and usage tracking for tiered pricing';
COMMENT ON COLUMN sellers.plan IS 'Current pricing tier: starter, pro, or scale';
COMMENT ON COLUMN sellers.links_generated_count IS 'Number of checkout links created this billing period';
COMMENT ON COLUMN sellers.usage_period_start IS 'Start date of current billing period';
COMMENT ON FUNCTION increment_usage IS 'Atomically increment usage counter with limit checking';
COMMENT ON FUNCTION reset_monthly_usage IS 'Reset all usage counters at start of new billing period';
