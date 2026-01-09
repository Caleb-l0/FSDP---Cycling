
const pool = require("../Postgres_config");

/**

 */
async function getUserById(id) {
  const sql = `
    SELECT 
      id,
      name,
      email,
      role,
      level,
      joindate
    FROM users
    WHERE id = $1
  `;

  const result = await pool.query(sql, [id]);
  return result.rows[0];
}

/**

 */
async function getUserExperience(userId) {
  const sql = `
    SELECT
      COUNT(es.eventid) AS total_events,
      MIN(es.signupdate) AS first_event_date
    FROM eventsignups es
    WHERE es.userid = $1
      AND es.status = 'Active'
  `;

  const result = await pool.query(sql, [userId]);
  return result.rows[0];
}

/**

 */
async function getUserEvent(userId) {
  const sql = `
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
  `;

  const result = await pool.query(sql, [userId]);
  return result.rows;
}

/**

 */
async function getUserBadge(userId) {
  const sql = `
    SELECT
      b.badgeid,
      b.badgename,
      b.badgetype,
      b.description,
      b.iconurl,
      sb.getdate
    FROM studentbadges sb
    JOIN badges b
      ON sb.badgeid = b.badgeid
    WHERE sb.userid = $1
      AND sb.status = 'active'
    ORDER BY sb.getdate DESC
  `;

  const result = await pool.query(sql, [userId]);
  return result.rows;
}



module.exports ={
    getUserById,
    getUserBadge,
    getUserEvent,
    getUserExperience,


}