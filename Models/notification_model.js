const pool = require("../Postgres_config");

async function createNotification({ userId, type, title, message, payload = null, scheduledFor = null, visibleAt = null }) {
  const scheduled = scheduledFor instanceof Date ? scheduledFor.toISOString() : scheduledFor;
  const visible = visibleAt instanceof Date ? visibleAt.toISOString() : visibleAt;
  const payloadJson = payload != null && typeof payload !== "string" ? JSON.stringify(payload) : payload;
  const result = await pool.query(
    `
      INSERT INTO notifications (userid, type, title, message, payload, scheduled_for, visibleat)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `,
    [userId, type, title, message, payloadJson, scheduled || null, visible || null]
  );
  return result.rows[0];
}

async function createNotificationsForUsers({ userIds, type, title, message, payload = null }) {
  if (!Array.isArray(userIds) || userIds.length === 0) return [];

  const payloadJson = payload != null && typeof payload !== "string" ? JSON.stringify(payload) : payload;

  const result = await pool.query(
    `
      INSERT INTO notifications (userid, type, title, message, payload)
      SELECT x.userid, $2, $3, $4, $5
      FROM UNNEST($1::int[]) AS x(userid)
      RETURNING *
    `,
    [userIds, type, title, message, payloadJson]
  );

  return result.rows;
}

async function getUserNotifications(userId, { unreadOnly = false, limit = 50, visibleOnly = false } = {}) {
  const lim = Math.max(1, Math.min(Number(limit) || 50, 200));
  const result = await pool.query(
    `
      SELECT notificationid, userid, type, title, message, payload, createdat, readat, scheduled_for, visibleat
      FROM notifications
      WHERE userid = $1
        AND ($2::boolean = false OR readat IS NULL)
        AND ($4::boolean = false OR (visibleat IS NOT NULL OR scheduled_for IS NULL))
      ORDER BY createdat DESC
      LIMIT $3
    `,
    [userId, Boolean(unreadOnly), lim, Boolean(visibleOnly)]
  );
  return result.rows;
}

async function markRead(userId, notificationId) {
  const id = Number(notificationId);
  if (!Number.isFinite(id)) return null;

  const result = await pool.query(
    `
      UPDATE notifications
      SET readat = NOW()
      WHERE notificationid = $1 AND userid = $2 AND readat IS NULL
      RETURNING notificationid, userid, type, title, message, payload, createdat, readat
    `,
    [id, userId]
  );
  return result.rows[0] || null;
}

async function markAllRead(userId) {
  const result = await pool.query(
    `
      UPDATE notifications
      SET readat = NOW()
      WHERE userid = $1 AND readat IS NULL
      RETURNING notificationid
    `,
    [userId]
  );
  return result.rows;
}

module.exports = {
  createNotification,
  createNotificationsForUsers,
  getUserNotifications,
  markRead,
  markAllRead
};
