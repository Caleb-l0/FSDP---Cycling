const pool = require("../Postgres_config");

async function createNotification({ userId, type, title, message, payload = null }) {
  const result = await pool.query(
    `
      INSERT INTO notifications (userid, type, title, message, payload)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
    [userId, type, title, message, payload]
  );
  return result.rows[0];
}

async function createNotificationsForUsers({ userIds, type, title, message, payload = null }) {
  if (!Array.isArray(userIds) || userIds.length === 0) return [];

  const result = await pool.query(
    `
      INSERT INTO notifications (userid, type, title, message, payload)
      SELECT x.userid, $2, $3, $4, $5
      FROM UNNEST($1::int[]) AS x(userid)
      RETURNING *
    `,
    [userIds, type, title, message, payload]
  );

  return result.rows;
}

async function getUserNotifications(userId, { unreadOnly = false, limit = 50 } = {}) {
  const lim = Math.max(1, Math.min(Number(limit) || 50, 200));
  const result = await pool.query(
    `
      SELECT notificationid, userid, type, title, message, payload, createdat, readat
      FROM notifications
      WHERE userid = $1
        AND ($2::boolean = false OR readat IS NULL)
      ORDER BY createdat DESC
      LIMIT $3
    `,
    [userId, Boolean(unreadOnly), lim]
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
