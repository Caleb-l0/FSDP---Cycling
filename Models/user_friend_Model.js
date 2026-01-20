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


async function getFriendSignUpEvents(friendId) {
  const result = await pool.query(`
    SELECT e.eventid, e.eventname, e.eventdate, es.signupdate, es.status, es.
    FROM eventsignups es
    JOIN events e ON es.eventid = e.eventid
    WHERE es.userid = $1
    ORDER BY e.eventdate DESC
  `, [friendId]);
  return result.rows;
}

module.exports = {
  getUserFriends,
  addFriend,
  removeFriend,
  getFollowersCount,
  isFriend
};
