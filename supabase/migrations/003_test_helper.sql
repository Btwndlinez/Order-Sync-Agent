-- Helper function for integration tests
-- Allows executing arbitrary SQL statements (for testing only)

CREATE OR REPLACE FUNCTION execute_sql(sql TEXT, params TEXT[] DEFAULT NULL)
RETURNS TABLE(result JSONB) AS $$
DECLARE
    param_count INTEGER;
    param_value TEXT;
    param_type TEXT;
    dynamic_sql TEXT;
    result_json JSONB;
BEGIN
    -- This is a simplified version for basic SELECT queries
    -- For production, use prepared statements or proper query builders
    
    -- For testing, we'll execute the SQL directly
    -- WARNING: This is dangerous in production - only for testing!
    
    BEGIN
        -- Try to execute as SELECT
        EXECUTE format('SELECT to_jsonb(subquery.*) FROM (%s) subquery', sql)
        INTO result_json;
        
        RETURN QUERY SELECT result_json;
    EXCEPTION
        WHEN OTHERS THEN
            -- If it's not a SELECT, try to execute and return status
            BEGIN
                EXECUTE sql;
                RETURN QUERY SELECT '{"status": "executed"}'::JSONB;
            EXCEPTION
                WHEN OTHERS THEN
                    RAISE EXCEPTION 'SQL execution failed: %', SQLERRM;
            END;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;