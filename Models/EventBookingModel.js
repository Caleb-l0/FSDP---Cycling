const pool = require("../Postgres_config");

/* ======================================================
   Event Booking Model
   Purpose: Handle organization bookings for events
   Table: eventbookings (organizations book events created by admin)
   ====================================================== */

/* ------------------------------
   1. Get Upcoming Event
------------------------------ */
async function getUpcomingEvent(eventId) {
  const result = await pool.query(
    `
    SELECT *
    FROM events
    WHERE eventid = $1 AND status = 'Upcoming'
    `,
    [eventId]
  );

  return result.rows[0] || null;
}

/* ------------------------------
   2. Get Available Events (not yet booked)
------------------------------ */
async function getAvailableEvents() {
  const result = await pool.query(
    `
    SELECT 
      e.eventid,
      e.eventname,
      e.eventdate,
      e.location,
      e.description,
      e.requiredvolunteers,
      e.maximumparticipant,
      e.status,
      e.createdat,
      e.peoplesignup
    FROM events e
    WHERE e.organizationid IS NULL
      AND e.status = 'Upcoming'
      AND e.eventdate > NOW()
      AND NOT EXISTS (
        SELECT 1 
        FROM eventbookings eb
        WHERE eb.eventid = e.eventid 
          AND eb.status = 'Approved'
      )
    ORDER BY e.eventdate ASC
    `
  );

  return result.rows;
}

/* ------------------------------
   3. Create Booking Request (Pending status)
------------------------------ */
async function createBookingRequest(bookingData) {
  const { eventId, organizationId, participants, sessionHeadName, sessionHeadContact, sessionHeadEmail } = bookingData;
  
  const result = await pool.query(
    `
    INSERT INTO eventbookings 
      (eventid, organizationid, participants, status, session_head_name, session_head_contact, session_head_email)
    VALUES ($1, $2, $3, 'Pending', $4, $5, $6)
    RETURNING *
    `,
    [eventId, organizationId, participants, sessionHeadName || null, sessionHeadContact || null, sessionHeadEmail || null]
  );

  return result.rows[0];
}

/* ------------------------------
   4. Get All Booking Requests (for admin)
------------------------------ */
async function getAllBookingRequests() {
  const result = await pool.query(
    `
    SELECT 
      eb.bookingid,
      eb.eventid,
      eb.organizationid,
      eb.participants,
      eb.status,
      eb.session_head_name,
      eb.session_head_contact,
      eb.session_head_email,
      eb.createdat,
      eb.reviewedby,
      eb.reviewdate,
      e.eventname,
      e.eventdate,
      e.location,
      e.description,
      e.peoplesignup,
      o.orgname
    FROM eventbookings eb
    INNER JOIN events e ON eb.eventid = e.eventid
    LEFT JOIN organizations o ON eb.organizationid = o.organizationid
    ORDER BY eb.createdat DESC
    `
  );

  return result.rows;
}

/* ------------------------------
   5. Get Booking Request By ID
------------------------------ */
async function getBookingRequestById(bookingId) {
  const result = await pool.query(
    `
    SELECT 
      eb.*,
      e.eventname,
      e.eventdate,
      e.location,
      e.description,
      o.orgname
    FROM eventbookings eb
    INNER JOIN events e ON eb.eventid = e.eventid
    LEFT JOIN organizations o ON eb.organizationid = o.organizationid
    WHERE eb.bookingid = $1
    `,
    [bookingId]
  );

  return result.rows[0] || null;
}

/* ------------------------------
   6. Approve Booking Request
------------------------------ */
async function approveBookingRequest(bookingId, reviewedBy) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // 1. Update booking status
    const bookingResult = await client.query(
      `
      UPDATE eventbookings
      SET status = 'Approved',
          reviewedby = $2,
          reviewdate = NOW()
      WHERE bookingid = $1
      RETURNING *
      `,
      [bookingId, reviewedBy]
    );

    const booking = bookingResult.rows[0];
    if (!booking) {
      throw new Error('Booking not found');
    }

    // 2. Update event to assign organization
    await client.query(
      `
      UPDATE events
      SET organizationid = $2,
          updatedat = NOW()
      WHERE eventid = $1
      `,
      [booking.eventid, booking.organizationid]
    );

    // 3. Update people sign up count
    await client.query(
      `
      UPDATE events
      SET peoplesignup = COALESCE(peoplesignup, 0) + $2
      WHERE eventid = $1
      `,
      [booking.eventid, booking.participants]
    );

    // 4. Calculate and update volunteers needed
    const volunteersNeeded = Math.ceil(booking.participants / 5);
    await client.query(
      `
      UPDATE events
      SET requiredvolunteers = COALESCE(requiredvolunteers, 0) + $2,
          updatedat = NOW()
      WHERE eventid = $1
      `,
      [booking.eventid, volunteersNeeded]
    );

    await client.query('COMMIT');
    
    return booking;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/* ------------------------------
   7. Reject Booking Request
------------------------------ */
async function rejectBookingRequest(bookingId, reviewedBy) {
  const result = await pool.query(
    `
    UPDATE eventbookings
    SET status = 'Rejected',
        reviewedby = $2,
        reviewdate = NOW()
    WHERE bookingid = $1
    RETURNING *
    `,
    [bookingId, reviewedBy]
  );

  return result.rows[0] || null;
}

/* ------------------------------
   8. Get Organization's Bookings
------------------------------ */
async function getOrganizationBookings(organizationId) {
  const result = await pool.query(
    `
    SELECT 
      eb.*,
      e.eventname,
      e.eventdate,
      e.location,
      e.description,
      e.status AS eventstatus
    FROM eventbookings eb
    INNER JOIN events e ON eb.eventid = e.eventid
    WHERE eb.organizationid = $1
    ORDER BY eb.createdat DESC
    `,
    [organizationId]
  );

  return result.rows;
}

/* ------------------------------
   9. Assign Event Head (Update session head info)
------------------------------ */
async function assignEventHead(bookingId, eventHeadData) {
  const { eventHeadName, eventHeadContact, eventHeadEmail, eventHeadProfile } = eventHeadData;
  
  const result = await pool.query(
    `
    UPDATE eventbookings
    SET session_head_name = $2,
        session_head_contact = $3,
        session_head_email = $4,
        session_head_profile = $5,
        updatedat = NOW()
    WHERE bookingid = $1
    RETURNING *
    `,
    [bookingId, eventHeadName, eventHeadContact, eventHeadEmail, eventHeadProfile || null]
  );

  if (result.rows.length === 0) {
    throw new Error('Booking not found');
  }

  return result.rows[0];
}

/* ------------------------------
   10. Check if Event has Participants
------------------------------ */
async function hasParticipants(eventId) {
  const result = await pool.query(
    `
    SELECT COALESCE(peoplesignup, 0) AS participants
    FROM events
    WHERE eventid = $1
    `,
    [eventId]
  );

  return result.rows[0]?.participants > 0;
}

/* ------------------------------
   10. Delete Events with No Participants (for auto-delete)
------------------------------ */
async function deleteEventsWithNoParticipants() {
  const result = await pool.query(
    `
    DELETE FROM events
    WHERE organizationid IS NULL
      AND (peoplesignup IS NULL OR peoplesignup = 0)
      AND eventdate > NOW() + INTERVAL '1 day'
      AND eventdate < NOW() + INTERVAL '2 days'
      AND status = 'Upcoming'
    RETURNING eventid, eventname, eventdate
    `
  );

  return result.rows;
}

module.exports = {
  getUpcomingEvent,
  getAvailableEvents,
  createBookingRequest,
  getAllBookingRequests,
  getBookingRequestById,
  approveBookingRequest,
  rejectBookingRequest,
  getOrganizationBookings,
  assignEventHead,
  hasParticipants,
  deleteEventsWithNoParticipants
};
