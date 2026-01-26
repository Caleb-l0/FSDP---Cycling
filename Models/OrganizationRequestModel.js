const { get } = require("../mailer");
const pool = require("../Postgres_config");


// ======================================================
// Organization Request Model
// Purpose: Handle organization requests for events
// Table: volunterrequests (organizations request events to be created)
// Note: Table name is misspelled in database (missing 'e' in volunteer)
// ======================================================


// ======================================================
// Note: getOrganizationIDByUserID has been removed
// All organization ID logic is now centralized in GetEmail_Controller.js
// Use /user/organization-id endpoint instead
// ======================================================
// 1. Create Organization Request
// ======================================================

async function getOrganisationID(){
    try {
        const pool = await sql.connect(db);

        const result = await pool.request()
           
            .query(`
                SELECT OrganizationID FROM Organizations;
            `);

        return result.recordset;  
        
    } catch (err) {
        console.error("Error fetching organ id:", err);
        throw err;
    }
}



async function createRequest(requestData) {
  try {
    const { organizationid, requesterid, eventname, eventdate, description, requiredvolunteers } = requestData;
    
    const result = await pool.query(
      `
      INSERT INTO volunterrequests 
        (organizationid, requesterid, eventname, eventdate, description, requiredvolunteers, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'Pending')
      RETURNING *
      `,
      [organizationid, requesterid, eventname, eventdate, description, requiredvolunteers]
    );
    
    return result.rows[0];
  } catch (err) {
    console.error("createRequest SQL error:", err);
    throw err;
  }
}


// ======================================================
// 2. Get All Requests
// ======================================================
async function getAllRequests() {
  try {
    const result = await pool.query(`
      SELECT *
      FROM volunterrequests
      ORDER BY requestid ASC
    `);
    return result.rows;
  } catch (err) {
    console.error("getAllRequests SQL error:", err);
    throw err;
  }
}


// ======================================================
// 3. Get Request By ID
// ======================================================
async function getRequestById(id) {
  const result = await pool.query(
    `SELECT * FROM volunterrequests WHERE requestid = $1`,
    [id]
  );

  return result.rows[0] || null;
}


// ======================================================
// 4. Approve Request
// ======================================================
async function approveRequest(requestID) {
  await pool.query(
    `
    UPDATE volunterrequests
    SET status = 'Approved'
    WHERE requestid = $1
    `,
    [requestID]
  );

  return true;
}


// ======================================================
// 5. Reject Request
// ======================================================
async function rejectRequest(requestID) {
  await pool.query(
    `
    UPDATE volunterrequests
    SET status = 'Rejected'
    WHERE requestid = $1
    `,
    [requestID]
  );

  return true;
}


// ======================================================
// 6. Check Request Status
// ======================================================
async function checkRequestStatus(requestID) {
  const result = await pool.query(
    `
    SELECT status
    FROM volunterrequests
    WHERE requestid = $1
    `,
    [requestID]
  );

  return result.rows[0] || null;
}


// ======================================================
// 7. Delete Request
// ======================================================
async function deleteRequest(requestID) {
  const result = await pool.query(
    `DELETE FROM volunterrequests WHERE requestid = $1 RETURNING *`,
    [requestID]
  );

  return result.rows[0] || null;
}


async function getOrganisationIDByUserID(userID) {
  try {
    const result = await pool.query(
      `
      SELECT uo.organizationid
      FROM userorganizations uo
      WHERE uo.userid = $1
      `,
      [userID]
    );

    return result.rows[0] ? result.rows[0].organizationid : null;
  } catch (err) {
    console.error("getOrganisationIDByUserID SQL error:", err);
    // If mapping table doesn't exist yet (or other schema issues), treat as no org mapping
    return null;
  }
}


async function getOrganisationByUserID(userID) {
  try {
    const result = await pool.query(
      `
      SELECT o.organizationid, o.orgname, o.orgdescription
      FROM userorganizations uo
      JOIN organizations o ON o.organizationid = uo.organizationid
      WHERE uo.userid = $1
      `,
      [userID]
    );

    return result.rows[0] || null;
  } catch (err) {
    console.error("getOrganisationByUserID SQL error:", err);
    throw err;
  }
}

async function getAllOrganizationRequests(organizationID) {
  try {
    const result = await pool.query(
      `
      SELECT *
      FROM volunterrequests
      WHERE organizationid = $1
      ORDER BY requestid ASC
      `,
      [organizationID]
    );
    return result.rows;
  }
  catch (err) {
    console.error("getAllOrganizationRequests SQL error:", err);
    throw err;
  }
}


async function getEventPeopleSignups(eventID) {
  try {
    const result = await pool.query(
      `
      SELECT u.userid, u.name, u.email
      FROM eventsignups es
      JOIN users u ON es.userid = u.userid
      WHERE es.eventid = $1
      `,
      [eventID]
    );
    return result.rows;
  }
  catch (err) {
    console.error("getEventPeopleSignups SQL error:", err);
    throw err;
  }
}




// ======================================================
module.exports = {
  createRequest,
  getAllRequests,
  getRequestById,
  approveRequest,
  rejectRequest,
  checkRequestStatus,
  deleteRequest,getOrganisationID, getOrganisationIDByUserID, getAllOrganizationRequests,getEventPeopleSignups
};

