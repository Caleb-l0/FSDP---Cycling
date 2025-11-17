const sql = require("mssql");
const db = require("../dbconfig");
const { get } = require("mongoose");


async function getAllRequests() {
    await sql.connect(db);
    const result = await sql.query`SELECT * FROM VolunteerRequests`;
    return result.recordset;

}


async function getRequestById(id) {
    pool = await sql.connect(db);
    const request = pool.request();
     
    request.input('RequestID', sql.Int, id);
    const result = await request.query`SELECT * FROM VolunteerRequests WHERE RequestID = @RequestID`;
    return result.recordset[0];
}

async function approveRequest(requestID) {
  const pool = await sql.connect(db);

  await pool.request()
    .input("RequestID", sql.Int, requestID)
    .query(`
      UPDATE VolunteerRequests
      SET Status = 'Approved'
      WHERE RequestID = @RequestID
    `);

  return true;
}




module.exports = { getAllRequests,approveRequest, getRequestByOragnization, getRequestByApproved,getRequestByHistory,getRequestById };

