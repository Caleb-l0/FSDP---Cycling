-- Migration script to update eventbookings table for booking request system
-- Run this to add status and session head fields

-- Add status column (Pending, Approved, Rejected)
ALTER TABLE eventbookings 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Pending' 
CHECK (status IN ('Pending', 'Approved', 'Rejected'));

-- Add session head information
ALTER TABLE eventbookings 
ADD COLUMN IF NOT EXISTS session_head_name VARCHAR(100);

ALTER TABLE eventbookings 
ADD COLUMN IF NOT EXISTS session_head_contact VARCHAR(20);

ALTER TABLE eventbookings 
ADD COLUMN IF NOT EXISTS session_head_email VARCHAR(100);

-- Add reviewed by and review date for admin tracking
ALTER TABLE eventbookings 
ADD COLUMN IF NOT EXISTS reviewedby INT;

ALTER TABLE eventbookings 
ADD COLUMN IF NOT EXISTS reviewdate TIMESTAMP;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_eventbookings_status ON eventbookings(status);
CREATE INDEX IF NOT EXISTS idx_eventbookings_eventid ON eventbookings(eventid);
CREATE INDEX IF NOT EXISTS idx_eventbookings_organizationid ON eventbookings(organizationid);

