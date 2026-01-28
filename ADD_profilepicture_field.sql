-- Step 2: Add profilepicture column if it doesn't exist
-- Run this SQL in your PostgreSQL database

-- Option A: If column doesn't exist, add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'profilepicture'
    ) THEN
        ALTER TABLE users ADD COLUMN profilepicture TEXT;
        RAISE NOTICE 'profilepicture column added successfully';
    ELSE
        RAISE NOTICE 'profilepicture column already exists';
    END IF;
END $$;

-- Option B: If column exists but is VARCHAR with limited size, change it to TEXT
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
        RAISE NOTICE 'profilepicture column changed from VARCHAR to TEXT';
    END IF;
END $$;

-- Verify the column was created/updated correctly
SELECT 
    column_name, 
    data_type, 
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'profilepicture';
