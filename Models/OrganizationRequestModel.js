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


async function getUserOrganizationID(req, res) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const userIdInt = Number(req.user.id);
    if (!Number.isInteger(userIdInt)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const result = await pool.query(
      `
      SELECT organizationid
      FROM userorganizations
      WHERE userid = $1
      ORDER BY joinedat DESC
      LIMIT 1
      `,
      [userIdInt]
    );

    const organizationId = result.rows.length ? result.rows[0].organizationid : null;
    return res.status(200).json({ organizationId });
  } catch (error) {
    console.error("getUserOrganizationID error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
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

// For /organisations/events/:eventID/signups - returns { count, signups: [{ name, email, signupdate, checkedin }] }
async function getEventSignups(eventID) {
  try {
    const result = await pool.query(
      `
      SELECT u.name, u.email, es.signupdate
      FROM eventsignups es
      JOIN users u ON es.userid = u.id
      WHERE es.eventid = $1 AND (es.status IS NULL OR es.status = 'Active')
      ORDER BY es.signupdate ASC
      `,
      [eventID]
    );
    const signups = (result.rows || []).map((r) => ({
      name: r.name,
      email: r.email,
      signupdate: r.signupdate,
      checkedin: false
    }));
    return { count: signups.length, signups };
  } catch (err) {
    console.error("getEventSignups SQL error:", err);
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
  deleteRequest,
  getOrganisationIDByUserID,
  getAllOrganizationRequests,
  getEventPeopleSignups,
  getEventSignups
};

