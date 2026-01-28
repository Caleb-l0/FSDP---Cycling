-- Elderly Companion Panel migration (minimal / reuse existing tables)

-- 1) Store elderly-specific booking info on eventsignups (same table used by volunteer signups)
ALTER TABLE eventsignups
ADD COLUMN IF NOT EXISTS special_needs JSONB NULL;

ALTER TABLE eventsignups
ADD COLUMN IF NOT EXISTS notes TEXT NULL;

-- optional: mark the source of the signup (e.g. volunteer / elderly / etc.)
ALTER TABLE eventsignups
ADD COLUMN IF NOT EXISTS signup_source VARCHAR(30) NULL;

CREATE INDEX IF NOT EXISTS idx_eventsignups_user_eventid ON eventsignups(userid, eventid);

-- 2) Scheduled notifications: keep using existing notifications table, add scheduling fields
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ NULL;

ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS visibleat TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_for ON notifications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notifications_user_visibleat ON notifications(userid, visibleat DESC);

-- 3) Optional cache table for preferred location + last known lat/lng (not required, but improves UX)
CREATE TABLE IF NOT EXISTS user_profile_cache (
  userid INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  preferred_location TEXT NULL,
  last_lat DOUBLE PRECISION NULL,
  last_lng DOUBLE PRECISION NULL,
  updatedat TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4) Optional telemetry for explainability/debugging (safe / non-breaking)
CREATE TABLE IF NOT EXISTS telemetry_events (
  telemetryid SERIAL PRIMARY KEY,
  userid INT NULL REFERENCES users(id) ON DELETE SET NULL,
  type VARCHAR(64) NOT NULL,
  payload JSONB NULL,
  createdat TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telemetry_events_user_createdat ON telemetry_events(userid, createdat DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_events_type_createdat ON telemetry_events(type, createdat DESC);
