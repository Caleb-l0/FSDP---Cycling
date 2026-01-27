const pool = require("../Postgres_config");


// ======================================================
// 1. Get all events (OrganizationID NOT NULL)
// ======================================================
async function getAllEvents() {
  const result = await pool.query(`
      SELECT
        e.*,
        (
          SELECT COUNT(*)::int
          FROM eventsignups es
          WHERE es.eventid = e.eventid AND es.status = 'Active'
        ) AS volunteer_signup_count
      FROM events e
      WHERE e.organizationid IS NOT NULL
  `);

  return result.rows;
}



// ======================================================
// 2. Sign Up For Event (avoid duplicate sign-up)
// ======================================================
async function signUpForEvent(eventId, userId) {

  // 1. check duplicate
  const check = await pool.query(
    `
      SELECT *
      FROM eventsignups
      WHERE eventid = $1 AND userid = $2
    `,
    [eventId, userId]
  );

  if (check.rows.length > 0) {
    throw new Error("User already signed up for this event.");
  }

  // 2. insert sign-up
  await pool.query(
    `
      INSERT INTO eventsignups (eventid, userid)
      VALUES ($1, $2)
    `,
    [eventId, userId]
  );
}



// ======================================================
// 3. Get all signed-up events for a user
// ======================================================
async function getSignedUpEvents(userId) {

  const result = await pool.query(
    `
      SELECT 
        e.eventid,
        e.eventname,
        e.eventdate,
        e.description,
        e.location,      
        e.requiredvolunteers,
        e.status,
        es.signupdate,
        es.status AS signupstatus
      FROM eventsignups es
      INNER JOIN events e ON es.eventid = e.eventid
      WHERE es.userid = $1 AND es.status = 'Active'
      ORDER BY e.eventdate ASC
    `,
    [userId]
  );

  return result.rows;
}


async function getEventById(eventId) {
  const result = await pool.query(
    `
    SELECT
      e.*,
      eb.bookingid,
      eb.session_head_name,
      eb.session_head_contact,
      eb.session_head_email,
      eb.session_head_profile,
      u.id AS eventheaduserid
    FROM events e
    LEFT JOIN LATERAL (
      SELECT
        bookingid,
        session_head_name,
        session_head_contact,
        session_head_email,
        session_head_profile
      FROM eventbookings
      WHERE eventid = e.eventid
        AND status = 'Approved'
      ORDER BY reviewdate DESC NULLS LAST, createdat DESC
      LIMIT 1
    ) eb ON TRUE
    LEFT JOIN users u
      ON u.email = eb.session_head_email
    WHERE e.eventid = $1
    `,
    [eventId]
  );
  return result.rows[0];
} 










module.exports = {
  getAllEvents,
  signUpForEvent,
  getSignedUpEvents,
  getEventById,
};



/*
const { poolPromise, sql } = require('../public/db');

async function getAllEvents() {
  const pool = await poolPromise;
  const result = await pool.request().query('SELECT * FROM Events WHERE OrganizationID IS NOT  NULL');
  return result.recordset;
}

async function signUpForEvent(eventId, userId) {
  const pool = await poolPromise;

  // check duplicate
  const check = await pool.request()
    .input('EventID', sql.Int, eventId)
    .input('UserID', sql.Int, userId)
    .query(`
      SELECT * FROM EventSignUps 
      WHERE EventID = @EventID AND UserID = @UserID
    `);

  if (check.recordset.length > 0) {
    throw new Error('User already signed up for this event.');
  }

  // insert
  await pool.request()
    .input('EventID', sql.Int, eventId)
    .input('UserID', sql.Int, userId)
    .query(`
      INSERT INTO EventSignUps (EventID, UserID)
      VALUES (@EventID, @UserID)
    `);
}


async function getSignedUpEvents(userId) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('UserID', sql.Int, userId)
    .query(`
      SELECT 
        e.EventID,
        e.EventName,
        e.EventDate,
        e.Description,
        e.Location,      
        e.RequiredVolunteers,
        e.Status,
        es.SignUpDate,
        es.Status AS SignUpStatus
      FROM EventSignUps es
      INNER JOIN Events e ON es.EventID = e.EventID
      WHERE es.UserID = @UserID AND es.Status = 'Active'
      ORDER BY e.EventDate ASC
    `);
  return result.recordset;
}



module.exports = { getAllEvents, signUpForEvent, getSignedUpEvents };

*/