const pool = require("../Postgres_config");

async function publishDueNotifications({ limit = 200 } = {}) {
  const lim = Math.max(1, Math.min(Number(limit) || 200, 1000));

  const res = await pool.query(
    `
    WITH due AS (
      SELECT notificationid
      FROM notifications
      WHERE visibleat IS NULL
        AND scheduled_for IS NOT NULL
        AND scheduled_for <= NOW()
      ORDER BY scheduled_for ASC
      LIMIT $1
    )
    UPDATE notifications n
    SET visibleat = NOW()
    FROM due
    WHERE n.notificationid = due.notificationid
    RETURNING n.notificationid
    `,
    [lim]
  );

  return res.rows || [];
}

module.exports = {
  publishDueNotifications
};
