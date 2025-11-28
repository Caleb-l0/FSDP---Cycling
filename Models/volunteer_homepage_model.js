
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