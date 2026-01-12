const pool = require("../Postgres_config");


// ======================================================
// 1. Get All Requests
// ======================================================
async function getAllRequests() {
  try {
    const result = await pool.query(`
      SELECT *
      FROM volunteerrequests
      ORDER BY requestid ASC
    `);
    return result.rows;
  } catch (err) {
    console.error("getAllRequests SQL error:", err);
    throw err;
  }
}



// ======================================================
// 2. Get Request By ID
// ======================================================
async function getRequestById(id) {
  const result = await pool.query(
    `SELECT * FROM volunteerrequests WHERE requestid = $1`,
    [id]
  );

  return result.rows[0] || null;
}



// ======================================================
// 3. Approve Request
// ======================================================
async function approveRequest(requestID) {
  await pool.query(
    `
    UPDATE volunteerrequests
    SET status = 'Approved'
    WHERE requestid = $1
    `,
    [requestID]
  );

  return true;
}



// ======================================================
// 4. Check Request Status
// ======================================================
async function checkRequestStatus(requestID) {
  const result = await pool.query(
    `
    SELECT status
    FROM volunteerrequests
    WHERE requestid = $1
    `,
    [requestID]
  );

  return result.rows[0] || null;
}



// ======================================================
// 5. Reject Request
// ======================================================
async function rejectRequest(requestID) {
  await pool.query(
    `
    UPDATE volunteerrequests
    SET status = 'Rejected'
    WHERE requestid = $1
    `,
    [requestID]
  );

  return true;
}



// ======================================================
module.exports = {
  getAllRequests,
  approveRequest,
  rejectRequest,
  getRequestById,
  checkRequestStatus
};



/*const sql = require("mssql");
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

async function checkRequestStatus(requestID) {
  try {
    const pool = await sql.connect(db);

    const result = await pool.request()
      .input("RequestID", sql.Int, requestID)
      .query(`
        SELECT Status 
        FROM VolunteerRequests
        WHERE RequestID = @RequestID
      `);

    return result.recordset[0]; 
  } catch (err) {
    console.error("Error checking request status:", err);
    throw err;
  }
}


async function rejectRequest(requestID){
   const pool = await sql.connect(db);

  await pool.request()
    .input("RequestID", sql.Int, requestID)
    .query(`
      UPDATE VolunteerRequests
      SET Status = 'Rejected'
      WHERE RequestID = @RequestID
    `);

  return true;
}




module.exports = { getAllRequests,approveRequest,rejectRequest,getRequestById,checkRequestStatus };
*/
