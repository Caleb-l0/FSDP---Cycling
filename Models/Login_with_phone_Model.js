const pool = require("../db");

async function getUserByPhone(phone) {
  const result = await pool.query(
    "SELECT * FROM users WHERE phone = $1",
    [phone]
  );
  return result.rows[0];
}

async function createUserWithPhone(phone, firebaseUid) {
  const result = await pool.query(
    `
    INSERT INTO users (phone, firebase_uid, role, name)
    VALUES ($1, $2, 'volunteer', 'New User')
    RETURNING *
    `,
    [phone, firebaseUid]
  );
  return result.rows[0];
}

module.exports = {
  getUserByPhone,
  createUserWithPhone
};
