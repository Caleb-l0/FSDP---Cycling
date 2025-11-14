const sql = require("mssql");
const db = require("../dbconfig");




async function getAllEvents() {
    await sql.connect(db);
    const result = await sql.query`SELECT * FROM Events`;
    return result.recordset;
}

async function createEvent(eventData) {
  try {
    const pool = await sql.connect(db);

    const result = await pool.request()
      .input("VolunteerRequestID", sql.Int, eventData.VolunteerRequestID)
      .input("OrganizationID", sql.Int, eventData.OrganizationID)
      .input("EventName", sql.NVarChar(100), eventData.EventName)
      .input("EventDate", sql.DateTime, eventData.EventDate)
      .input("Description", sql.NVarChar(sql.MAX), eventData.Description)
      .input("RequiredVolunteers", sql.Int, eventData.RequiredVolunteers)
      .input("PeopleSignUp", sql.Int, 0)
      .input("Status", sql.NVarChar(20), eventData.Status)
      .query(`
        INSERT INTO Events
        (VolunteerRequestID, OrganizationID, EventName, EventDate, Description,
         RequiredVolunteers, PeopleSignUp, Status)
        OUTPUT inserted.*
        VALUES
        (@VolunteerRequestID, @OrganizationID, @EventName, @EventDate, @Description,
         @RequiredVolunteers, @PeopleSignUp, @Status)
      `);

    return result.recordset[0];

  } catch (err) {
    console.error("Error creating event model:", err);
    throw err;
  }
}



module.exports = { getAllEvents,createEvent };