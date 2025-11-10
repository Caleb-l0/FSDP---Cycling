const sql = require("mssql");
const dbConfig = require("../../database"); // adjust if needed

async function createEventRequest(eventName, eventDate, description, requiredVolunteers, specialInvite) {
  try {
    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input("eventName", sql.NVarChar, eventName)
      .input("eventDate", sql.Date, eventDate)
      .input("description", sql.NVarChar, description)
      .input("requiredVolunteers", sql.Int, requiredVolunteers)
      .input("specialInvite", sql.NVarChar, specialInvite || "")
      .query(`
        INSERT INTO VolunteerRequests (EventName, EventDate, Description, RequiredVolunteers, SpecialInvite)
        VALUES (@eventName, @eventDate, @description, @requiredVolunteers, @specialInvite)
      `);

    return { success: true };
  } catch (err) {
    console.error("SQL error in createEventRequest:", err);
    throw err;
  }
}

module.exports = { createEventRequest };
