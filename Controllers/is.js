const sql = require("mssql");
const db = require("../dbconfig");

async function requestEvent(req, res) {
  const { OrganizationID, EventName, EventDate, Description, RequiredVolunteers, RequesterID } = req.body;

  try {
    const pool = await sql.connect(db);

    await pool.request()
      .input("OrganizationID", sql.Int, OrganizationID)
      .input("RequesterID", sql.Int, RequesterID)
      .input("EventName", sql.NVarChar, EventName)
      .input("EventDate", sql.DateTime, EventDate)
      .input("Description", sql.NVarChar, Description)
      .input("RequiredVolunteers", sql.Int, RequiredVolunteers)
      .query(`
        INSERT INTO VolunteerRequests
        (OrganizationID, RequesterID, EventName, EventDate, Description, RequiredVolunteers, Status)
        VALUES
        (@OrganizationID, @RequesterID, @EventName, @EventDate, @Description, @RequiredVolunteers, 'Pending')
      `);

    res.status(200).json({ message: "Volunteer request submitted!" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to submit request", error: err.message });
  }
}




module.exports = { requestEvent };
