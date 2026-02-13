-- Activity Logs Table for Audit Trail
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    seller_id UUID REFERENCES sellers(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    product_id UUID,
    product_name VARCHAR(255),
    message_preview TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast recent queries
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_seller ON activity_logs(seller_id, created_at DESC);

-- Enable RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Allow public read for activity logs
CREATE POLICY "Allow read activity_logs"
ON activity_logs FOR SELECT
TO anon, authenticated
USING (true);

-- Allow authenticated insert
CREATE POLICY "Allow insert activity_logs"
ON activity_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- Function to log activity
CREATE OR REPLACE FUNCTION log_activity(
    p_seller_id UUID,
    p_action VARCHAR,
    p_product_id UUID DEFAULT NULL,
    p_product_name VARCHAR DEFAULT NULL,
    p_message_preview TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO activity_logs (seller_id, action, product_id, product_name, message_preview, metadata)
    VALUES (p_seller_id, p_action, p_product_id, p_product_name, p_message_preview, p_metadata)
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$;

-- Seed some demo activity logs
INSERT INTO activity_logs (action, product_name, message_preview, created_at) VALUES
('push_to_chat', 'Blue Hoodie', 'Hi! I want to buy the blue hoodie in size M', NOW() - INTERVAL '1 minute'),
('link_copied', 'Red T-Shirt', NULL, NOW() - INTERVAL '5 minutes'),
('category_selected', 'Black Jeans', 'Order Intent', NOW() - INTERVAL '10 minutes'),
('push_to_chat', 'White Sneakers', 'What sizes do you have?', NOW() - INTERVAL '15 minutes'),
('link_copied', 'Gray Hoodie', NULL, NOW() - INTERVAL '20 minutes')
ON CONFLICT DO NOTHING;
