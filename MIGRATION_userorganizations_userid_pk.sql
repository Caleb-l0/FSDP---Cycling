BEGIN;

-- Ensure 1 row per userid before adding PK
WITH ranked AS (
  SELECT
    ctid,
    userid,
    ROW_NUMBER() OVER (PARTITION BY userid ORDER BY joinedat DESC, userorgid DESC) AS rn
  FROM userorganizations
)
DELETE FROM userorganizations
WHERE ctid IN (SELECT ctid FROM ranked WHERE rn > 1);

-- Drop existing primary key (was on userorgid)
ALTER TABLE userorganizations
DROP CONSTRAINT IF EXISTS userorganizations_pkey;

-- Make userid the primary key
ALTER TABLE userorganizations
ADD CONSTRAINT userorganizations_pkey PRIMARY KEY (userid);

COMMIT;
