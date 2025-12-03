const pool = require("../Postgres_config");


// ======================================
// 1. Find Form by Email
// ======================================
async function findForm(email) {
  const result = await pool.query(
    `
      SELECT *
      FROM forms
      WHERE email = $1
    `,
    [email]
  );

  return result.rows[0] || null;
}



// ======================================
// 2. Get Form by ID
// ======================================
async function getFormById(id) {
  const result = await pool.query(
    `
      SELECT id, title, description, datetime
      FROM forms
      WHERE id = $1
    `,
    [id]
  );

  return result.rows[0] || null;
}



// ======================================
// 3. Update Form (Dynamic Update)
// ======================================
async function updateForm(id, title, description, datetime) {
  const updates = [];
  const values = [];
  let index = 1;

  if (title) {
    updates.push(`title = $${index++}`);
    values.push(title);
  }

  if (description) {
    updates.push(`description = $${index++}`);
    values.push(description);
  }

  if (datetime) {
    updates.push(`datetime = $${index++}`);
    values.push(datetime);
  }

  if (updates.length === 0) return;

  values.push(id);

  const query = `
    UPDATE forms
    SET ${updates.join(", ")}
    WHERE id = $${index}
  `;

  await pool.query(query, values);
}



// ======================================
// 4. Delete Form
// ======================================
async function deleteForm(id) {
  await pool.query(
    `
      DELETE FROM forms
      WHERE id = $1
    `,
    [id]
  );
}



module.exports = {
  findForm,
  getFormById,
  updateForm,
  deleteForm
};


/*
const sql = require("mssql");
const db = require("../../dbconfig");

async function findForm(email) {
  await sql.connect(db);
  const result = await sql.query`SELECT * FROM forms WHERE id = ${id}`;
  return result.recordset[0];
}

async function getFormById(id) {
  await sql.connect(db);
  const result = await sql.query`
    SELECT id, title, dedscription, datetime FROM forms WHERE id = ${id}
  `;
  return result.recordset[0];
}

async function updateForm(id, name, email) {
  let updates = [];
    if (name) updates.push(`title='${title}'`);
    if (email) updates.push(`description='${description}'`);
    if (datetime) updates.push(`datetime='${datetime}'`);
    if (updates.length === 0) return;
    const query = `UPDATE forms SET ${updates.join(", ")} WHERE id=${id}`;
    await sql.query(query);
}

async function deleteForm(id) {
  await sql.connect(db);
  await sql.query`DELETE FROM forms WHERE id = ${id}`;
}


module.exports = { findForm, getFormById, updateForm, deleteForm };
*/