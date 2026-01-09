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

module.exports = {
  getUserFriends
};