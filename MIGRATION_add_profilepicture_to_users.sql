-- Add profilepicture column to users table for storing avatar images (base64 encoded)
-- PostgreSQL version

-- Check if column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'profilepicture'
    ) THEN
        ALTER TABLE users ADD COLUMN profilepicture TEXT;
    END IF;
END $$;

-- If the column exists but is VARCHAR with limited size, we need to change it to TEXT
-- First check the current type
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'profilepicture'
        AND data_type = 'character varying'
    ) THEN
        -- Drop and recreate with TEXT type
        ALTER TABLE users DROP COLUMN profilepicture;
        ALTER TABLE users ADD COLUMN profilepicture TEXT;
    END IF;
END $$;
