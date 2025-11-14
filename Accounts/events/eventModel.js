const sql = require("mssql");
const dbConfig = require("../../dbconfig.js");

async function createEventRequest(data) {
  const pool = await sql.connect(dbConfig);

  const result = await pool.request()
    .input("OrganizationID", sql.Int, data.OrganizationID)
    .input("RequesterID", sql.Int, data.RequesterID)
    .input("EventName", sql.NVarChar, data.EventName)
    .input("EventDate", sql.DateTime, data.EventDate)
    .input("Description", sql.NVarChar, data.Description)
    .input("RequiredVolunteers", sql.Int, data.RequiredVolunteers)
    .input("SpecialInvite", sql.NVarChar, data.SpecialInvite)
    .query(`
      INSERT INTO VolunteerRequests 
      (OrganizationID, RequesterID, EventName, EventDate, Description, RequiredVolunteers, Status)
      OUTPUT INSERTED.RequestID
      VALUES (@OrganizationID, @RequesterID, @EventName, @EventDate, @Description, @RequiredVolunteers, 'Pending')
    `);

  return result.recordset[0].RequestID;
}

async function notifyAdmins(requestId, eventName) {
  const pool = await sql.connect(dbConfig);

  const admins = await pool.request()
    .query(`SELECT id FROM Users WHERE role = 'admin'`);

  for (const admin of admins.recordset) {
    await pool.request()
      .input("UserID", sql.Int, admin.id)
      .input("RequestID", sql.Int, requestId)
      .input("Message", sql.NVarChar, `New volunteer request: ${eventName}`)
      .query(`
        INSERT INTO Notifications (UserID, RequestID, Message)
        VALUES (@UserID, @RequestID, @Message)
      `);
  }
}


module.exports = { createEventRequest, notifyAdmins };
