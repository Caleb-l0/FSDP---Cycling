CREATE TABLE IF NOT EXISTS notifications (
  notificationid SERIAL PRIMARY KEY,
  userid INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(64) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  payload JSONB NULL,
  createdat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  readat TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_createdat ON notifications(userid, createdat DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_readat ON notifications(userid, readat);
