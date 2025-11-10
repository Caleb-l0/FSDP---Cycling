const sql = require("mssql");
const db = require("../../dbConfig");

async function findUserByEmail(email) {
  await sql.connect(db);
  const result = await sql.query`SELECT * FROM Users WHERE email = ${email}`;
  return result.recordset[0];
}

async function createUser(name, email, hashedPassword) {
  await sql.connect(db);
  await sql.query`
    INSERT INTO Users (name, email, password)
    VALUES (${name}, ${email}, ${hashedPassword})
  `;
}

module.exports = { findUserByEmail, createUser };
