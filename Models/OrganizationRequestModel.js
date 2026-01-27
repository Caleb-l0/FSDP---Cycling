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

async function assignEventHeadToRequest({
  requestId,
  organizationId,
  eventHeadName,
  eventHeadContact,
  eventHeadEmail,
  eventHeadProfile
}) {
  try {
    // 1) Verify request exists and is Approved
    const reqResult = await pool.query(
      `
      SELECT
        vr.requestid,
        vr.eventid,
        vr.organizationid,
        vr.requiredvolunteers,
        e.maximumparticipant
      FROM volunterrequests vr
      JOIN events e ON e.eventid = vr.eventid
      WHERE vr.requestid = $1
        AND vr.organizationid = $2
        AND vr.status = 'Approved'
      `,
      [requestId, organizationId]
    );

    if (reqResult.rows.length === 0) {
      throw new Error("Approved request not found for this organization");
    }

    const req = reqResult.rows[0];

    // 2) Prevent duplicate booking for same request
    const existingBooking = await pool.query(
      `
      SELECT bookingid
      FROM eventbookings
      WHERE requestid = $1
      LIMIT 1
      `,
      [requestId]
    );

    if (existingBooking.rows.length > 0) {
      throw new Error("This request has already been booked");
    }

    // 3) Insert into eventbookings (SUCCESS record)
    const bookingResult = await pool.query(
      `
      INSERT INTO eventbookings (
        eventid,
        organizationid,
        participants,
        status,
        session_head_name,
        session_head_contact,
        session_head_email,
        session_head_profile,
        requestid,
        createdat
      )
      VALUES ($1, $2, $3, 'Approved', $4, $5, $6, $7, $8, NOW())
      RETURNING *
      `,
      [
        req.eventid,
        req.organizationid,
        req.requiredvolunteers,
        eventHeadName,
        eventHeadContact,
        eventHeadEmail,
        eventHeadProfile || null,
        requestId
      ]
    );

    // 4) Mark request as completed / fulfilled
    await pool.query(
      `
      UPDATE volunterrequests
      SET status = 'Completed', updatedat = NOW()
      WHERE requestid = $1
      `,
      [requestId]
    );

    return bookingResult.rows[0];
  } catch (err) {
    console.error("assignEventHeadToRequest SQL error:", err);
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
      SELECT u.id, u.name, u.email
      FROM eventsignups es
      JOIN users u ON es.userid = u.id
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
    // Safety: ensure numbers
    const orgId = Number(organizationId);
    const reqId = Number(requesterId);
    const evId = Number(eventId);

    if (!orgId || !reqId || !evId) {
      throw new Error("Invalid organizationId/requesterId/eventId");
    }

    // 1) Get event details (include signup counts + max)
    const eventResult = await pool.query(
      `
      SELECT
        eventid,
        eventname,
        eventdate,
        description,
        requiredvolunteers,
        organizationid,
        maximumparticipant,
        COALESCE(participantsignup, 0) AS participantsignup
      FROM events
      WHERE eventid = $1
      `,
      [evId]
    );

    if (eventResult.rows.length === 0) {
      throw new Error("Event not found");
    }

    const event = eventResult.rows[0];

    // 2) Check if event is already assigned to an organization
    if (event.organizationid !== null) {
      throw new Error("This event is already assigned to an organization");
    }

    // 3) Threshold gate (choose one)

    // ✅ Option A (RECOMMENDED): allow request once volunteer signups reach requiredvolunteers
    const threshold = Number(event.requiredvolunteers || 0);

    // ✅ Option B (STRICT): allow request only when event is fully booked
    // const threshold = Number(event.maximumparticipant || 0);

    const signedUp = Number(event.participantsignup || 0);

    if (threshold > 0 && signedUp < threshold) {
      const remaining = threshold - signedUp;
      throw new Error(
        `Cannot request booking yet: volunteers signed up ${signedUp}. Need at least ${threshold}. (${remaining} more needed)`
      );
    }

    // 4) Check if a pending request already exists for this event from this organization
    const existingRequest = await pool.query(
      `
      SELECT requestid
      FROM volunterrequests
      WHERE eventid = $1 AND organizationid = $2 AND status = 'Pending'
      LIMIT 1
      `,
      [evId, orgId]
    );

    if (existingRequest.rows.length > 0) {
      throw new Error("You already have a pending request for this event");
    }

    // 5) Create the booking request
    const result = await pool.query(
      `
      INSERT INTO volunterrequests
        (organizationid, requesterid, eventid, eventname, eventdate, description, requiredvolunteers, status)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, 'Pending')
      RETURNING *
      `,
      [
        orgId,
        reqId,
        evId,
        event.eventname,
        event.eventdate,
        event.description,
        event.requiredvolunteers
      ]
    );

    return result.rows[0];
  } catch (err) {
    console.error("createEventBookingRequest SQL error:", err);
    throw err;
  }
}

async function getOrganizationMembers(organizationId) {
  try {
    const orgId = Number(organizationId);
    if (!orgId) return [];

    const result = await pool.query(
      `
      SELECT
        u.id,
        u.name,
        u.email,
        u.phone,
        uo.orgrole
      FROM userorganizations uo
      JOIN users u ON u.id = uo.userid
      WHERE uo.organizationid = $1
      ORDER BY u.name ASC
      `,
      [orgId]
    );

    return result.rows || [];
  } catch (err) {
    console.error("getOrganizationMembers SQL error:", err);
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
  assignEventHeadToRequest,
  getOrganizationMembers
};

