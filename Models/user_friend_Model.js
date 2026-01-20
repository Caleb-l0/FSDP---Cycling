const { get } = require("../mailer");
const pool = require("../Postgres_config");

/**
 * Get all friends of a user
 */
async function getUserFriends(userId, sortBy = "date") {
  let orderBy = "uf.adddate DESC";
  if (sortBy === "alpha") orderBy = "u.name ASC";

  const result = await pool.query(`
    SELECT
      u.id,
      u.name,
      u.level,
      u.joindate,
      uf.adddate,
      uf.friend_level,
      uf.nickname,
      uf.description
    FROM userfriends uf
    JOIN users u ON uf.friendid = u.id
    WHERE uf.userid = $1 AND uf.status = 'active'
    ORDER BY ${orderBy}
  `, [userId]);

  return result.rows;
}

async function addFriend(userId, friendId) {
  const result = await pool.query(`
    INSERT INTO userfriends (userid, friendid, status)
    VALUES ($1, $2, 'active')
    ON CONFLICT (userid, friendid)
    DO UPDATE SET status = 'active'
    RETURNING *
  `, [userId, friendId]);

  return result.rows[0];
}

async function getFollowersCount(userId) {
  const result = await pool.query(`
    SELECT COUNT(*)
    FROM userfriends
    WHERE friendid = $1 AND status = 'active'
  `, [userId]);

  return parseInt(result.rows[0].count);
}

async function removeFriend(userId, friendId) {
  const result = await pool.query(`
    UPDATE userfriends
    SET status = 'removed'
    WHERE userid = $1 AND friendid = $2
    RETURNING *
  `, [userId, friendId]);

  return result.rows[0];
}

async function isFriend(userId, friendId) {
  const result = await pool.query(`
    SELECT 1
    FROM userfriends
    WHERE userid = $1 AND friendid = $2 AND status = 'active'
  `, [userId, friendId]);

  return result.rows.length > 0;
}


async function getAllFriendsSignUpEvents(userId) {
  const result = await pool.query(`
    WITH friends AS (
      SELECT DISTINCT
        CASE 
          WHEN uf.userid = $1 THEN uf.friendid
          ELSE uf.userid
        END AS friend_id
      FROM userfriends uf
      WHERE (uf.userid = $1 OR uf.friendid = $1)
        AND uf.status = 'active'
    )
    SELECT
      f.friend_id,
      u.name AS friend_name,
      e.eventid,
      e.eventname,
      e.eventdate,
      e.location,
      e.eventimage,
      e.status AS event_status,
      es.signupdate AS signup_date,
      es.status AS signup_status
    FROM friends f
    JOIN users u ON u.id = f.friend_id
    JOIN eventsignups es ON es.userid = f.friend_id
    JOIN events e ON e.eventid = es.eventid
    ORDER BY u.name ASC, e.eventdate DESC, es.signupdate DESC
  `, [userId]);

  const map = new Map();
  for (const r of result.rows) {
    if (!map.has(r.friend_id)) {
      map.set(r.friend_id, {
        friendId: r.friend_id,
        friendName: r.friend_name,
        events: []
      });
    }
    map.get(r.friend_id).events.push({
      eventid: r.eventid,
      eventname: r.eventname,
      eventdate: r.eventdate,
      location: r.location,
      eventimage: r.eventimage,
      status: r.event_status,
      signup_date: r.signup_date,
      signup_status: r.signup_status
    });
  }

  return Array.from(map.values());
}



module.exports = {
  getUserFriends,
  addFriend,
  removeFriend,
  getFollowersCount,
  isFriend,getAllFriendsSignUpEvents,
};
