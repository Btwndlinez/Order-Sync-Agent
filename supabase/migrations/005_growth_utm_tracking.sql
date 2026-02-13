-- ============================================================================
-- Growth Phase: UTM Tracking & Waitlist Schema Update
-- ============================================================================

-- Add UTM tracking columns to waitlist table
ALTER TABLE waitlist 
ADD COLUMN IF NOT EXISTS utm_source VARCHAR(100),
ADD COLUMN IF NOT EXISTS utm_medium VARCHAR(100),
ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(200),
ADD COLUMN IF NOT EXISTS utm_content VARCHAR(200),
ADD COLUMN IF NOT EXISTS utm_term VARCHAR(200),
ADD COLUMN IF NOT EXISTS exit_intent_triggered BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS referrer_url TEXT;

-- Create index for UTM analysis
CREATE INDEX IF NOT EXISTS idx_waitlist_utm_source ON waitlist(utm_source) WHERE utm_source IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_waitlist_utm_campaign ON waitlist(utm_campaign) WHERE utm_campaign IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_waitlist_exit_intent ON waitlist(exit_intent_triggered) WHERE exit_intent_triggered = TRUE;

-- Analytics view: Conversion by UTM source
CREATE OR REPLACE VIEW waitlist_utm_analytics AS
SELECT 
    COALESCE(utm_source, 'direct') as source,
    COALESCE(utm_medium, 'none') as medium,
    COALESCE(utm_campaign, 'none') as campaign,
    COUNT(*) as total_signups,
    COUNT(*) FILTER (WHERE exit_intent_triggered = true) as exit_intent_signups,
    ROUND(
        (COUNT(*) FILTER (WHERE exit_intent_triggered = true)::FLOAT / NULLIF(COUNT(*), 0)) * 100, 
        2
    ) as exit_intent_percentage,
    MIN(created_at) as first_signup,
    MAX(created_at) as last_signup
FROM waitlist
GROUP BY utm_source, utm_medium, utm_campaign
ORDER BY total_signups DESC;
