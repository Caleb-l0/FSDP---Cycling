const sql = require("mssql");
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


module.exports = { findUserByEmail, createUser };
