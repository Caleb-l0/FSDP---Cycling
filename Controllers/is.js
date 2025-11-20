const sql = require("mssql");
const db = require("../dbconfig");

async function requestEvent(req, res) {
  const { EventID, OrganizationID, EventName, EventDate, Description, RequiredVolunteers } = req.body;

  try {
    const pool = await sql.connect(db);

    await pool.request()
      .input("EventID", sql.Int, EventID)
      .input("OrganizationID", sql.Int, OrganizationID)
      .input("EventName", sql.NVarChar, EventName)
      .input("EventDate", sql.DateTime, EventDate)
      .input("Description", sql.NVarChar, Description)
      .input("RequiredVolunteers", sql.Int, RequiredVolunteers)
      .query(`
        INSERT INTO VolunteerRequests 
        (EventID, OrganizationID, EventName, EventDate, Description, RequiredVolunteers, Status)
        VALUES
        (@EventID, @OrganizationID, @EventName, @EventDate, @Description, @RequiredVolunteers, 'Pending')
      `);

    res.status(200).json({ message: "Volunteer request submitted!" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to submit request" });
  }
}

module.exports = { requestEvent };
