
const pool = require("../../Postgres_config");

// Find user by email (PostgreSQL)
async function findUserByEmail(email) {
  const query = `
    SELECT *
    FROM users
    WHERE email = $1
    LIMIT 1
  `;

  const values = [email];

  const result = await pool.query(query, values);
  return result.rows[0];   // PostgreSQL => result.rows
}


// Create User (Signup)
async function createUser(name, email, hashedPassword, role) {
  const query = `
    INSERT INTO users (name, email, password, role, textsizepreference)
    VALUES ($1, $2, $3, $4, $5)
  `;

  const values = [
    name,
    email,
    hashedPassword,
    role,
    "normal"
  ];

  await pool.query(query, values);
}

module.exports = {
  findUserByEmail,
  createUser,
};

/*const sql = require("mssql");
const db = require("../../dbconfig");

async function findUserByEmail(email) {
  await sql.connect(db);
  const result = await sql.query`SELECT * FROM Users WHERE email = ${email}`;
  return result.recordset[0];
}

async function createUser(name, email, hashedPassword, role) {
  await sql.connect(db);
  await sql.query`
    INSERT INTO Users (name, email, password, role, textSizePreference)
    VALUES (${name}, ${email}, ${hashedPassword}, ${role}, ${'normal'})
  `;
}


module.exports = { findUserByEmail, createUser };*/
