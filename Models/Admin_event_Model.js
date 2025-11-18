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
      
      .input("OrganizationID", sql.Int, eventData.OrganizationID)
      .input("EventName", sql.NVarChar(100), eventData.EventName)
      .input("EventDate", sql.DateTime, eventData.EventDate)
      .input("Description", sql.NVarChar(sql.MAX), eventData.Description)
      .input("RequiredVolunteers", sql.Int, eventData.RequiredVolunteers)
      .input("PeopleSignUp", sql.Int, 0)
      .input("Status", sql.NVarChar(20), eventData.Status)
      .query(`
        INSERT INTO Events
        (OrganizationID, EventName, EventDate, Description,
         RequiredVolunteers, PeopleSignUp, Status)
        OUTPUT inserted.*
        VALUES
        (@OrganizationID, @EventName, @EventDate, @Description,
         @RequiredVolunteers, @PeopleSignUp, @Status)
      `);

    return result.recordset[0];

  } catch (err) {
    console.error("Error creating event model:", err);
    throw err;
  }
}

async function assignEventToOrgan(eventData) {
  try {
    const pool = await sql.connect(db);
    
    const result = await pool.request()
      .input("EventID", sql.Int, eventData.EventID)
      .input("OrganizationID", sql.Int, eventData.OrganizationID)
      .query(`
        UPDATE Events
        SET OrganizationID = @OrganizationID,
            UpdatedAt = GETDATE()
        WHERE EventID = @EventID
      `);

    return { message: "Event updated successfully" };

  } catch (err) {
    console.error("Error updating event:", err);
    throw err;
  }
}
async function getEventLocation(eventID) {
  try {
    const pool = await sql.connect(db);

    const result = await pool.request()
      .input("EventID", sql.Int, eventID)
      .query(`
        SELECT Location
        FROM Events 
        WHERE EventID = @EventID
      `);

    return result.recordset[0]; 

  } catch (err) {
    console.error("Model getEventLocation Error:", err);
    throw err;
  }
}


module.exports = { getAllEvents,createEvent, assignEventToOrgan,getEventLocation};