-- Migration: Add profile fields to users table
-- Run this to add homeaddress, phonenumber, and advantages columns

-- Add homeaddress column (note: using homeaddress, not homeAddress for PostgreSQL)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS homeaddress VARCHAR(255);

-- Add phonenumber column (note: profile uses phonenumber, but users table has 'phone')
-- If phone exists, we can use it, or add phonenumber as separate
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phonenumber VARCHAR(20);

-- Add advantages column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS advantages TEXT;

