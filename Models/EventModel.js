const sql = require("mssql");
const db = require("../dbconfig");

async function getEventById(eventID) {
  const pool = await sql.connect(db);
  const result = await pool.request()
    .input("EventID", sql.Int, eventID)
    .query(`SELECT * FROM Events WHERE EventID = @EventID`);
  return result.recordset[0];
}

async function checkAssigned(eventID) {
  const pool = await sql.connect(db);

  const result = await pool.request()
    .input("EventID", sql.Int, eventID)
    .query(`
      SELECT OrganizationID
      FROM Events
      WHERE EventID = @EventID
    `);

  // event not found
  if (result.recordset.length === 0) return false;

  const orgID = result.recordset[0].OrganizationID;

  return orgID !== null;
}

async function deleteEvent(eventID) {
  const pool = await sql.connect(db);
  await pool.request()
    .input("EventID", sql.Int, eventID)
    .query(`DELETE FROM Events WHERE EventID = @EventID`);
}

async function signup(userID, eventID) {
  const pool = await sql.connect(db);
  await pool.request()
    .input("UserID", sql.Int, userID)
    .input("EventID", sql.Int, eventID)
    .query(`
      INSERT INTO EventVolunteers(UserID, EventID)
      VALUES(@UserID, @EventID)
    `);

  await pool.request()
    .input("EventID", sql.Int, eventID)
    .query(`
      UPDATE Events SET PeopleSignUp = PeopleSignUp + 1
      WHERE EventID = @EventID
    `);
}

async function cancel(userID, eventID) {
  const pool = await sql.connect(db);
  await pool.request()
    .input("UserID", sql.Int, userID)
    .input("EventID", sql.Int, eventID)
    .query(`
      DELETE FROM EventVolunteers
      WHERE UserID = @UserID AND EventID = @EventID
    `);

  await pool.request()
    .input("EventID", sql.Int, eventID)
    .query(`
      UPDATE Events SET PeopleSignUp = PeopleSignUp - 1
      WHERE EventID = @EventID
    `);
}

async function isSignedUp(userID, eventID) {
  const pool = await sql.connect(db);
  const result = await pool.request()
    .input("UserID", sql.Int, userID)
    .input("EventID", sql.Int, eventID)
    .query(`
      SELECT * FROM EventVolunteers 
      WHERE UserID = @UserID AND EventID = @EventID
    `);

  return result.recordset.length > 0;
}


async function updateEvent(eventID, data) {
  const pool = await sql.connect(db);
  await pool.request()
    .input("EventID", sql.Int, eventID)
    .input("EventName", sql.NVarChar(100), data.EventName)
    .input("EventDate", sql.DateTime, data.EventDate)
    .input("Location", sql.NVarChar(sql.MAX), data.Location)
    .input("RequiredVolunteers", sql.Int, data.RequiredVolunteers)
    .input("Description", sql.NVarChar(sql.MAX), data.Description)
    .query(`
      UPDATE Events
      SET EventName=@EventName,
          EventDate=@EventDate,
          Location=@Location,
          RequiredVolunteers=@RequiredVolunteers,
          Description=@Description,
          UpdatedAt = GETDATE()
      WHERE EventID=@EventID
    `);
}



module.exports = {
  getEventById,
  checkAssigned,
  deleteEvent,
  signup,
  cancel,
  isSignedUp,
  updateEvent
};
