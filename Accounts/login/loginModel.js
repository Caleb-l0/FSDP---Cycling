const sql = require("mssql");
const db = require("../../dbconfig");

async function findUserByEmail(email) {
  await sql.connect(db);
  const result = await sql.query`SELECT * FROM Users WHERE email = ${email}`;
  return result.recordset[0];
}

async function getUserById(id) {
  await sql.connect(db);
  const result = await sql.query`
    SELECT id, name, email, role, textSizePreference FROM Users WHERE id = ${id}
  `;
  return result.recordset[0];
}

async function updateUser(id, name, email, textSizePreference) {
  await sql.connect(db);
  const updates = [];
  const request = new sql.Request();
  request.input("id", id);

  if (name) {
    updates.push("name=@name");
    request.input("name", name);
  }

  if (email) {
    updates.push("email=@email");
    request.input("email", email);
  }

  if (textSizePreference) {
    updates.push("textSizePreference=@textSizePreference");
    request.input("textSizePreference", textSizePreference);
  }

  if (updates.length === 0) return;
  const query = `UPDATE Users SET ${updates.join(", ")} WHERE id=@id`;
  await request.query(query);
}

async function deleteUser(id) {
  await sql.connect(db);
  await sql.query`DELETE FROM Users WHERE id = ${id}`;
}

module.exports = { findUserByEmail, getUserById, updateUser, deleteUser };
