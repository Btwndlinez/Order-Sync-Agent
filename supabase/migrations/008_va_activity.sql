-- VA Activity Table for Audit Trail
CREATE TABLE IF NOT EXISTS va_activity (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    va_id VARCHAR(100) NOT NULL DEFAULT 'default',
    action VARCHAR(50) NOT NULL,
    product_name VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_va_activity_va_id ON va_activity(va_id);
CREATE INDEX IF NOT EXISTS idx_va_activity_created_at ON va_activity(created_at DESC);

-- RLS
ALTER TABLE va_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read va_activity"
ON va_activity FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow insert va_activity"
ON va_activity FOR INSERT
TO authenticated
WITH CHECK (true);

-- Seed demo data
INSERT INTO va_activity (va_id, action, product_name, created_at) VALUES
('default', 'push_to_chat', 'Blue Hoodie', NOW() - INTERVAL '1 minute'),
('default', 'copy_link', 'Red T-Shirt', NOW() - INTERVAL '3 minutes'),
('default', 'category_select', 'Order Intent', NOW() - INTERVAL '5 minutes'),
('default', 'push_to_chat', 'White Sneakers', NOW() - INTERVAL '8 minutes'),
('default', 'dismiss', NULL, NOW() - INTERVAL '12 minutes')
ON CONFLICT DO NOTHING;
