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

async function hasApprovedBookingForEventAndOrg(eventId, organizationId) {
  const eid = Number(eventId);
  const orgId = Number(organizationId);
  if (!eid || !orgId) return false;

  const res = await pool.query(
    `
    SELECT 1
    FROM eventbookings
    WHERE eventid = $1
      AND organizationid = $2
      AND status = 'Approved'
    LIMIT 1
    `,
    [eid, orgId]
  );

  return res.rows.length > 0;
}

async function getInstitutionSignedEvents(organizationId) {
  try {
    const orgId = Number(organizationId);
    if (!orgId) return [];

    const result = await pool.query(
      `
      SELECT
        e.eventid AS "EventID",
        e.eventname AS "EventName",
        e.eventdate AS "EventDate",
        e.description AS "Description",
        e.location AS "EventLocation",
        e.requiredvolunteers AS "RequiredVolunteers",
        e.status AS "Status",
        eb.bookingid AS "BookingID",
        eb.participants AS "Participants",
        eb.createdat AS "BookedAt",
        eb.reviewdate AS "ReviewedAt",
        eb.status AS "BookingStatus"
      FROM eventbookings eb
      INNER JOIN events e ON e.eventid = eb.eventid
      WHERE eb.organizationid = $1
      ORDER BY eb.createdat DESC
      `,
      [orgId]
    );

    return result.rows || [];
  } catch (err) {
    console.error("getInstitutionSignedEvents SQL error:", err);
    throw err;
  }
}

async function assignEventHeadToRequest({
  eventId,
  organizationId,
  eventHeadName,
  eventHeadContact,
  eventHeadEmail,
  eventHeadProfile
}) {
  try {
    const eid = Number(eventId);
    const orgId = Number(organizationId);
    if (!eid || !orgId) {
      throw new Error('Invalid eventId or organizationId');
    }

    const updateSql = `
      UPDATE eventbookings
      SET
        session_head_name = $3,
        session_head_contact = $4,
        session_head_email = $5,
        session_head_profile = $6
      WHERE eventid = $1
        AND organizationid = $2
        AND status = 'Approved'
      RETURNING *
    `;

    const params = [
      eid,
      orgId,
      eventHeadName,
      eventHeadContact,
      eventHeadEmail,
      eventHeadProfile || null
    ];

    const result = await pool.query(updateSql, params);
    if (result.rows.length > 0) return result.rows[0];

    const bookingExists = await pool.query(
      `
      SELECT 1
      FROM eventbookings
      WHERE eventid = $1
        AND organizationid = $2
      LIMIT 1
      `,
      [eid, orgId]
    );

    if (bookingExists.rows.length === 0) {
      throw new Error('Event booking not found for this event and organization');
    }

    throw new Error('Approved event booking not found for this event and organization');
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

// For /organisations/events/:eventID/people - returns { count, volunteers: [{ id, name, email, phone, role, signupdate, signupid, checkin_time, checkout_time }] }
async function getEventPeopleSignups(eventID) {
  try {
    console.log('=== getEventPeopleSignups START ===');
    console.log('getEventPeopleSignups called with eventID:', eventID);
    console.log('eventID type:', typeof eventID);
    console.log('eventID value:', eventID);
    
    // Test database connection
    console.log('Testing database connection...');
    const testResult = await pool.query('SELECT NOW()');
    console.log('Database connection test successful:', testResult.rows[0]);
    
    // Direct query to get volunteers from eventsignups table (same table that maintains peoplesignup count)
    console.log('Executing volunteer query...');
    const result = await pool.query(
      `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.role,
        es.signupdate,
        es.signupid,
        es.checkin_time,
        es.checkout_time,
        es.status
      FROM eventsignups es
      JOIN users u ON es.userid = u.id
      WHERE es.eventid = $1 
        AND (es.status IS NULL OR es.status = 'Active' OR es.status = 'active')
      ORDER BY es.signupdate ASC
      `,
      [eventID]
    );
    
    console.log('Query executed successfully');
    console.log('Direct SQL query result rows:', result.rows);
    console.log('Number of volunteers found:', result.rows.length);
    
    // Update the peoplesignup count to match actual active signups
    console.log('Updating peoplesignup count...');
    await pool.query(
      'UPDATE events SET peoplesignup = $1 WHERE eventid = $2',
      [result.rows.length, eventID]
    );
    console.log('Updated peoplesignup count to:', result.rows.length);
    
    const volunteers = result.rows.map((row) => ({
      id: row.id,
      name: row.name || 'Unknown Volunteer',
      email: row.email || 'No email',
      phone: row.phone || 'No phone',
      role: row.role || 'volunteer',
      signupdate: row.signupdate,
      signupid: row.signupid,
      checkin_time: row.checkin_time,
      checkout_time: row.checkout_time
    }));
    
    console.log('Processed volunteers array:', volunteers);
    console.log('=== getEventPeopleSignups END ===');
    
    return {
      success: true,
      count: volunteers.length,
      volunteers: volunteers
    };
    
  } catch (err) {
    console.error('=== ERROR IN getEventPeopleSignups ===');
    console.error('Error in getEventPeopleSignups:', err);
    console.error('Error details:', {
      message: err.message,
      code: err.code,
      detail: err.detail,
      hint: err.hint,
      stack: err.stack
    });
    console.error('=== END ERROR ===');
    
    return {
      success: false,
      count: 0,
      volunteers: [],
      signups: [], // Add both for compatibility
      message: `Database error: ${err.message}`
    };
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

async function getOrganizationMembersExperience(organizationId) {
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
        uo.orgrole,
        COALESCE(
          JSONB_AGG(
            DISTINCT JSONB_BUILD_OBJECT(
              'eventId', e.eventid,
              'eventName', e.eventname,
              'eventDate', e.eventdate
            )
          ) FILTER (WHERE e.eventid IS NOT NULL),
          '[]'::jsonb
        ) AS events,
        COUNT(DISTINCT e.eventid) AS eventcount
      FROM userorganizations uo
      JOIN users u ON u.id = uo.userid
      LEFT JOIN eventbookings eb
        ON eb.status = 'Approved'
       AND eb.session_head_email = u.email
      LEFT JOIN events e
        ON e.eventid = eb.eventid
      WHERE uo.organizationid = $1
      GROUP BY u.id, u.name, u.email, u.phone, uo.orgrole
      ORDER BY u.name ASC
      `,
      [orgId]
    );

    return result.rows || [];
  } catch (err) {
    console.error("getOrganizationMembersExperience SQL error:", err);
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
  getOrganizationMembers,
  getOrganizationMembersExperience,
  getInstitutionSignedEvents,
  hasApprovedBookingForEventAndOrg
};


