const pool = require("../../Postgres_config");

// -------------------------------
// 1. Find user by email
// -------------------------------
async function findUserByEmail(email) {
  try {
    // Use LOWER() for case-insensitive email comparison
    const query = `
      SELECT *
      FROM users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
    `;

    const result = await pool.query(query, [email]);
    return result.rows[0];   // PostgreSQL uses rows
  } catch (error) {
    console.error("Error in findUserByEmail:", error);
    throw error;
  }
}


// -------------------------------
// 2. Get user by ID
// -------------------------------
async function getUserById(id) {
  const query = `
    SELECT id, name, email, role, textsizepreference
    FROM users
    WHERE id = $1
    LIMIT 1
  `;

  const result = await pool.query(query, [id]);
  return result.rows[0];
}


// -------------------------------
// 3. Update user (dynamic fields)
// -------------------------------
async function updateUser(id, name, email, textSizePreference) {

  const updates = [];
  const values = [];
  let index = 1;

  // push name
  if (name) {
    updates.push(`name = $${index}`);
    values.push(name);
    index++;
  }

  // push email
  if (email) {
    updates.push(`email = $${index}`);
    values.push(email);
    index++;
  }

  // push textSizePreference
  if (textSizePreference) {
    updates.push(`textsizepreference = $${index}`);
    values.push(textSizePreference);
    index++;
  }

  // Nothing to update
  if (updates.length === 0) return;

  // Add the id at the end
  values.push(id);

  const query = `
    UPDATE users
    SET ${updates.join(", ")}
    WHERE id = $${index}
  `;

  await pool.query(query, values);
}


// -------------------------------
// 4. Delete user
// -------------------------------
async function deleteUser(id) {
  const query = `
    DELETE FROM users
    WHERE id = $1
  `;

  await pool.query(query, [id]);
}


module.exports = {
  findUserByEmail,
  getUserById,
  updateUser,
  deleteUser
};

/*const sql = require("mssql");
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
*/
