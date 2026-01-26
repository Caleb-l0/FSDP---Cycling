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

async function assignEventHeadToRequest({ requestId, organizationId, eventHeadName, eventHeadContact, eventHeadEmail, eventHeadProfile }) {
  try {
    const result = await pool.query(
      `
      UPDATE volunterrequests
      SET
        session_head_name = $1,
        session_head_contact = $2,
        session_head_email = $3,
        session_head_profile = $4,
        updatedat = NOW()
      WHERE requestid = $5
        AND organizationid = $6
        AND status = 'Approved'
      RETURNING *
      `,
      [eventHeadName, eventHeadContact, eventHeadEmail, eventHeadProfile || null, requestId, organizationId]
    );

    return result.rows[0] || null;
  } catch (err) {
    console.error('assignEventHeadToRequest SQL error:', err);
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


// DB helper - returns organizationId or null (used by controller)
async function getOrganisationIDByUserID(userID) {
  try {
    const userIdInt = Number(userID);
    if (!Number.isInteger(userIdInt)) return null;

    const result = await pool.query(
      `
      SELECT organizationid
      FROM userorganizations
      WHERE userid = $1
      `,
      [userIdInt]
    );

    return result.rows[0] ? result.rows[0].organizationid : null;
  } catch (err) {
    console.error("getOrganisationIDByUserID SQL error:", err);
    return null;
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
// Create Booking Request for Existing Event
// ======================================================
async function createEventBookingRequest(organizationId, requesterId, eventId) {
  try {
    // First get the event details
    const eventResult = await pool.query(
      `SELECT eventid, eventname, eventdate, description, requiredvolunteers, organizationid 
       FROM events WHERE eventid = $1`,
      [eventId]
    );

    if (eventResult.rows.length === 0) {
      throw new Error('Event not found');
    }

    const event = eventResult.rows[0];

    // Check if event is already assigned to an organization
    if (event.organizationid !== null) {
      throw new Error('This event is already assigned to an organization');
    }

    // Check if a pending request already exists for this event from this organization
    const existingRequest = await pool.query(
      `SELECT * FROM volunterrequests 
       WHERE eventid = $1 AND organizationid = $2 AND status = 'Pending'`,
      [eventId, organizationId]
    );

    if (existingRequest.rows.length > 0) {
      throw new Error('You already have a pending request for this event');
    }

    // Create the booking request
    const result = await pool.query(
      `INSERT INTO volunterrequests 
        (organizationid, requesterid, eventid, eventname, eventdate, description, requiredvolunteers, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Pending')
       RETURNING *`,
      [organizationId, requesterId, eventId, event.eventname, event.eventdate, event.description, event.requiredvolunteers]
    );

    return result.rows[0];
  } catch (err) {
    console.error("createEventBookingRequest SQL error:", err);
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
  getEventSignups,
  createEventBookingRequest,
  assignEventHeadToRequest
};

