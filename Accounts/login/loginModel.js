const sql = require("mssql");
const db = require("../../dbConfig");

async function findUserByEmail(email) {
  await sql.connect(db);
  const result = await sql.query`SELECT * FROM Users WHERE email = ${email}`;
  return result.recordset[0];
}

async function getUserById(id) {
  await sql.connect(db);
  const result = await sql.query`
    SELECT id, name, email, profilePicUrl FROM Users WHERE id = ${id}
  `;
  return result.recordset[0];
}

async function updateUser(id, name, email, profilePicUrl, dateOfBirth) {
  let updates = [];
  if (name) updates.push(`name='${name}'`);
  if (email) updates.push(`email='${email}'`);
  if (profilePicUrl) updates.push(`profilePicUrl='${profilePicUrl}'`);
  if (dateOfBirth) updates.push(`dateOfBirth='${dateOfBirth}'`);
  if (updates.length === 0) return;
  const query = `UPDATE Users SET ${updates.join(", ")} WHERE id=${id}`;
  await sql.query(query);
}

async function deleteUser(id) {
  await sql.connect(db);
  await sql.query`DELETE FROM Users WHERE id = ${id}`;
}

module.exports = { findUserByEmail, getUserById, updateUser, deleteUser };
