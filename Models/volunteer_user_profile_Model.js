const pool = require("../Postgres_config");

/**
 * Get user basic information
 */
async function getUserById(id) {
  const result = await pool.query(
    `
      SELECT 
        id,
        name,
        email,
        phone,
        phonenumber,
        advantages,
        role,
        level,
        joindate,
        profilepicture
      FROM users
      WHERE id = $1
    `,
    [id]
  );

  return result.rows[0] || null;
}

/**
 * Get user volunteering experience summary
 */
async function getUserExperience(id) {
  const result = await pool.query(
    `
      SELECT
        COUNT(es.eventid) AS total_events,
        MIN(es.signupdate) AS first_event_date
      FROM eventsignups es
      WHERE es.userid = $1
        AND es.status = 'Active'
    `,
    [id]
  );

  return result.rows[0] || null;
}

function computeLevelFromTotalEvents(totalEvents) {
  const t = Number(totalEvents) || 0;
  if (t >= 20) return 4;
  if (t >= 10) return 3;
  if (t >= 5) return 2;
  return 1;
}

async function updateUserLevel(userId, level) {
  const uid = Number(userId);
  if (!uid) return;
  const lvl = Number(level);
  if (!Number.isFinite(lvl)) return;

  await pool.query(
    `
    UPDATE users
    SET level = $2
    WHERE id = $1
    `,
    [uid, lvl]
  );
}

/**
 * Get events joined by user
 */
async function getUserEvents(id) {
  const result = await pool.query(
    `
      SELECT
        e.eventid,
        e.eventname,
        e.eventdate,
        e.location,
        e.status
      FROM events e
      JOIN eventsignups es
        ON e.eventid = es.eventid
      WHERE es.userid = $1
      ORDER BY e.eventdate DESC
    `,
    [id]
  );

  return result.rows;
}

async function searchVolunteers(query, excludeUserId, limit = 10) {
  const q = String(query || '').trim();
  if (!q) return [];

  const like = `%${q}%`;
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 20);

  const result = await pool.query(
    `
      SELECT
        id,
        name,
        email,
        phonenumber,
        level,
        joindate
      FROM users
      WHERE role = 'volunteer'
        AND id <> $2
        AND (
          name ILIKE $1
          OR email ILIKE $1
          OR phonenumber ILIKE $1
          OR phone ILIKE $1
        )
      ORDER BY name ASC
      LIMIT ${safeLimit}
    `,
    [like, excludeUserId]
  );

  return result.rows;
}

/**
 * Get badges earned by user
 */
async function getUserBadges(id) {
  const result = await pool.query(
    `
      SELECT
        b.badgeid,
        b.badgename,
        b.badgetype,
        b.description,
        b.iconurl,
        sb.getdate
      FROM userbadges sb
      JOIN badges b
        ON sb.badgeid = b.badgeid
      WHERE sb.userid = $1
        AND sb.status = 'active'
      ORDER BY sb.getdate DESC
    `,
    [id]
  );

  return result.rows;
}

async function getFollowersCount(userId) {
  const result = await pool.query(
    `
    SELECT COUNT(*) 
    FROM userfriends 
    WHERE friendid = $1 AND status = 'active'
    `,
    [userId]
  );
  return parseInt(result.rows[0].count);
}




module.exports = {
  getUserById,
  getUserExperience,
  getUserEvents,
  getUserBadges,
  getFollowersCount,
  searchVolunteers,
  computeLevelFromTotalEvents,
  updateUserLevel,
  
};
