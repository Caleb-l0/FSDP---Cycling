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
    SELECT id, name, email, role, textsizepreference, homeaddress, phonenumber, advantages, profilepicture
    FROM users
    WHERE id = $1
    LIMIT 1
  `;

  const result = await pool.query(query, [id]);
  const user = result.rows[0];
  if (user) {
    console.log("getUserById - profilepicture exists:", !!user.profilepicture);
    console.log("getUserById - profilepicture length:", user.profilepicture ? user.profilepicture.length : 0);
  }
  return user;
}


// -------------------------------
// 3. Update user (dynamic fields)
// -------------------------------
async function updateUser(id, name, email, textSizePreference, homeAddress, phoneNumber, advantages, profilePicture) {

  const updates = [];
  const values = [];
  let index = 1;

  // push name
  if (name !== undefined) {
    updates.push(`name = $${index}`);
    values.push(name);
    index++;
  }

  // push email
  if (email !== undefined) {
    updates.push(`email = $${index}`);
    values.push(email);
    index++;
  }

  // push textSizePreference
  if (textSizePreference !== undefined) {
    updates.push(`textsizepreference = $${index}`);
    values.push(textSizePreference);
    index++;
  }

  // push homeAddress
  if (homeAddress !== undefined) {
    updates.push(`homeaddress = $${index}`);
    values.push(homeAddress);
    index++;
  }

  // push phoneNumber
  if (phoneNumber !== undefined) {
    updates.push(`phonenumber = $${index}`);
    values.push(phoneNumber);
    index++;
  }

  // push advantages
  if (advantages !== undefined) {
    updates.push(`advantages = $${index}`);
    values.push(advantages);
    index++;
  }

  // push profilePicture
  if (profilePicture !== undefined && profilePicture !== null && profilePicture !== "") {
    updates.push(`profilepicture = $${index}`);
    values.push(profilePicture);
    index++;
    console.log("Updating profilePicture, length:", profilePicture ? profilePicture.length : 0);
    console.log("Updating profilePicture, first 50 chars:", profilePicture ? profilePicture.substring(0, 50) : "N/A");
  } else {
    console.log("profilePicture not updated - value:", profilePicture, "type:", typeof profilePicture);
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

  console.log("Update query:", query);
  console.log("Update values count:", values.length);
  console.log("Update values (first 100 chars of each):", values.map(v => typeof v === 'string' && v.length > 100 ? v.substring(0, 100) + '...' : v));
  
  const result = await pool.query(query, values);
  console.log("Update result:", result.rowCount, "rows updated");
  
  // Verify the update by querying back
  if (result.rowCount > 0) {
    const verifyQuery = `SELECT profilepicture FROM users WHERE id = $1`;
    const verifyResult = await pool.query(verifyQuery, [id]);
    if (verifyResult.rows[0]) {
      const savedPic = verifyResult.rows[0].profilepicture;
      console.log("Verification - profilepicture saved:", !!savedPic, "length:", savedPic ? savedPic.length : 0);
    }
  }
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
