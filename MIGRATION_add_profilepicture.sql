-- Migration: Add profilepicture field to users table
-- Run this to add profilepicture column for storing avatar URLs (base64 encoded images can be large)
-- For SQL Server

-- Check if column exists and drop it if needed
IF EXISTS (
    SELECT 1 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'profilepicture'
)
BEGIN
    ALTER TABLE users DROP COLUMN profilepicture;
END

-- Add with NVARCHAR(MAX) type to support large base64 images (SQL Server equivalent of TEXT)
ALTER TABLE users 
ADD profilepicture NVARCHAR(MAX);
