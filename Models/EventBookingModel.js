const sql = require("mssql");

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
