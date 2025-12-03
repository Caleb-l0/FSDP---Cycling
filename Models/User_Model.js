const pool = require("../Postgres_config");

async function getRole(id) {
  const result = await pool.query(
    `
      SELECT role 
      FROM users
      WHERE id = $1
    `,
    [id]
  );

  return result.rows[0] || null;
}

module.exports = { getRole };



/*const sql = require("mssql");
const db = require("../dbconfig");
const { get } = require("mongoose");



async function getRole(id){
     const pool = await sql.connect(db);
   
     const result = await pool.request()
       .input("RequestID", sql.Int, id)
       .query(`
        SELECT role From Users Where id = @id
       `);
   
     return result;
}



module.exports = {getRole}
*/