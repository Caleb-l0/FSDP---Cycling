const sql = require("mssql");
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