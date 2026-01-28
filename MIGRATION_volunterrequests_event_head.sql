BEGIN;

ALTER TABLE volunterrequests
ADD COLUMN IF NOT EXISTS session_head_name VARCHAR(100);

ALTER TABLE volunterrequests
ADD COLUMN IF NOT EXISTS session_head_contact VARCHAR(20);

ALTER TABLE volunterrequests
ADD COLUMN IF NOT EXISTS session_head_email VARCHAR(100);

ALTER TABLE volunterrequests
ADD COLUMN IF NOT EXISTS session_head_profile TEXT;

COMMIT;
