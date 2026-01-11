const pool = require("../Postgres_config");

/**
 * Get all friends of a user
 * @param {number} userId
 * @param {string} sortBy - 'date' | 'alpha'
 */
async function getUserFriends(userId, sortBy = "date") {
  let orderBy = "uf.adddate DESC";

  if (sortBy === "alpha") {
    orderBy = "u.name ASC";
  }

  const result = await pool.query(
    `
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
    JOIN users u
      ON uf.friendid = u.id
    WHERE uf.userid = $1
      AND uf.status = 'active'
    ORDER BY ${orderBy}
    `,
    [userId]
  );

  return result.rows;
}


async function addFriend(userId, friendId) {
  const result = await pool.query(
    `
      INSERT INTO userfriends (userid, friendid, status, adddate)
      VALUES ($1, $2, 'active', NOW())
      RETURNING *
    `,
    [userId, friendId]
  );  
  return result.rows[0];
} 


async function  getFollowersCount(userId) {
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

async function remobeFriend(userId, friendId) {
  const result = await pool.query(
    `
      UPDATE userfriends
      SET status = 'inactive'
      WHERE userid = $1 AND friendid = $2
      RETURNING *
    `,
    [userId, friendId]
  );  
  return result.rows[0];
} 

async function isFriend(userId, friendId) {
  const result = await pool.query(
    ` 
      SELECT *
      FROM userfriends
      WHERE userid = $1 AND friendid = $2 AND status = 'active'
    `,
    [userId, friendId]
  );
  return result.rows.length > 0;
}



module.exports = {
  getUserFriends,
  addFriend,
  remobeFriend,
  getFollowersCount,
  isFriend,
};