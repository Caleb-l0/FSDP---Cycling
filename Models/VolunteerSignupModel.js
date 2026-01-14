const pool = require("../Postgres_config");


// ======================================================
// Volunteer Signup Model
// Purpose: Handle volunteer sign ups for events
// Table: eventsignups (volunteers sign up for events)
// ======================================================


// ======================================================
// 1. Sign Up For Event
// ======================================================
async function signUpForEvent(userID, eventID) {
  // Check existing signup
  const check = await pool.query(
    `
    SELECT 1 FROM eventsignups
    WHERE userid = $1 AND eventid = $2 AND status = 'Active'
    `,
    [userID, eventID]
  );

  if (check.rows.length > 0) {
    throw new Error("User already signed up");
  }

  // Insert signup
  await pool.query(
    `
    INSERT INTO eventsignups (userid, eventid)
    VALUES ($1, $2)
    `,
    [userID, eventID]
  );

  // Increment people signup count
  await pool.query(
    `
    UPDATE events
    SET peoplesignup = peoplesignup + 1
    WHERE eventid = $1
    `,
    [eventID]
  );
}


// ======================================================
// 2. Cancel Signup
// ======================================================
async function cancelSignup(userID, eventID) {
  const result = await pool.query(
    `
    UPDATE eventsignups
    SET status = 'Cancelled'
    WHERE userid = $1 AND eventid = $2 AND status = 'Active'
    RETURNING *
    `,
    [userID, eventID]
  );

  if (result.rowCount > 0) {
    await pool.query(
      `
      UPDATE events
      SET peoplesignup = GREATEST(peoplesignup - 1, 0)
      WHERE eventid = $1
      `,
      [eventID]
    );
  }

  return result;
}


// ======================================================
// 3. Check If User Already Signed Up
// ======================================================
async function isSignedUp(userID, eventID) {
  const result = await pool.query(
    `
    SELECT 1
    FROM eventsignups
    WHERE userid = $1 AND eventid = $2 AND status = 'Active'
    `,
    [userID, eventID]
  );

  return result.rows.length > 0;
}


// ======================================================
// 4. Get All Signed-Up Events For A User
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


// ======================================================
module.exports = {
  signUpForEvent,
  cancelSignup,
  isSignedUp,
  getSignedUpEvents
};

