const pool = require("../Postgres_config");

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
   2. Create Booking
------------------------------ */
async function createBooking(eventId, organizationId, participants) {
  await pool.query(
    `
    INSERT INTO eventbookings (eventid, organizationid, participants)
    VALUES ($1, $2, $3)
    `,
    [eventId, organizationId, participants]
  );
}

/* ------------------------------
   3. Update People Sign Up
------------------------------ */
async function updatePeopleSignUp(eventId, participants) {
  await pool.query(
    `
    UPDATE events
    SET peoplecount = COALESCE(peoplecount, 0) + $2
    WHERE eventid = $1
    `,
    [eventId, participants]
  );
}

/* ------------------------------
   4. Update Volunteers Needed
------------------------------ */
async function updateVolunteers(eventId, volunteersNeeded) {
  await pool.query(
    `
    UPDATE events
    SET requiredvolunteers = requiredvolunteers + $2,
        updatedat = NOW()
    WHERE eventid = $1
    `,
    [eventId, volunteersNeeded]
  );
}

module.exports = {
  getUpcomingEvent,
  createBooking,
  updatePeopleSignUp,
  updateVolunteers
};



/* const sql = require("mssql");

async function getUpcomingEvent(eventId) {
    const pool = await sql.connect();

    const result = await pool.request()
        .input("eventId", sql.Int, eventId)
        .query(`
            SELECT * FROM Events 
            WHERE EventID = @eventId AND Status = 'Upcoming'
        `);

    return result.recordset[0];
}

async function createBooking(eventId, organizationId, participants) {
    const pool = await sql.connect();

    return pool.request()
        .input("eventId", sql.Int, eventId)
        .input("orgId", sql.Int, organizationId)
        .input("participants", sql.Int, participants)
        .query(`
            INSERT INTO EventBookings (EventID, OrganizationID, Participants)
            VALUES (@eventId, @orgId, @participants)
        `);
}

async function updatePeopleSignUp(eventId, participants) {
    const pool = await sql.connect();

    return pool.request()
        .input("eventId", sql.Int, eventId)
        .input("participants", sql.Int, participants)
        .query(`
            UPDATE Events
            SET PeopleSignUp = ISNULL(PeopleSignUp, 0) + @participants
            WHERE EventID = @eventId
        `);
}

async function updateVolunteers(eventId, volunteersNeeded) {
    const pool = await sql.connect();
    
    return pool.request()
        .input("eventId", sql.Int, eventId)
        .input("volunteers", sql.Int, volunteersNeeded)
        .query(`
            UPDATE Events
            SET RequiredVolunteers = RequiredVolunteers + @volunteers,
                UpdatedAt = GETDATE()
            WHERE EventID = @eventId
        `);
}

module.exports = {
    getUpcomingEvent,
    createBooking,
    updatePeopleSignUp,
    updateVolunteers
};
*/