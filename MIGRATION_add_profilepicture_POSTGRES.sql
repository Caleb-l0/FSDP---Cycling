-- Migration: Add profilepicture field to users table (PostgreSQL version)
-- Run this to add profilepicture column for storing avatar URLs (base64 encoded images can be large)

-- First, drop the column if it exists with wrong type
ALTER TABLE users DROP COLUMN IF EXISTS profilepicture;

-- Add with TEXT type to support large base64 images
ALTER TABLE users 
ADD COLUMN profilepicture TEXT;
