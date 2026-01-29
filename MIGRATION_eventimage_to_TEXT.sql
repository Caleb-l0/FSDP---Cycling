-- Migration: Change eventimage column to TEXT for base64 event pictures
-- PostgreSQL version

-- If column exists as VARCHAR, drop and add as TEXT
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'events' 
        AND column_name = 'eventimage'
    ) THEN
        ALTER TABLE events DROP COLUMN eventimage;
    END IF;
    
    ALTER TABLE events ADD COLUMN eventimage TEXT;
END $$;
