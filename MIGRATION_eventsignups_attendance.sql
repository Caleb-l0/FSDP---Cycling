-- Migration: add attendance timestamps to eventsignups

ALTER TABLE eventsignups
ADD COLUMN IF NOT EXISTS checkin_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS checkout_time TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_eventsignups_eventid_checkin ON eventsignups(eventid, checkin_time);
CREATE INDEX IF NOT EXISTS idx_eventsignups_eventid_checkout ON eventsignups(eventid, checkout_time);
