const sql = require("mssql");
const db = require("../dbconfig");




// Get all events by location + date (same day)
async function getEventsByLocation(req, res) {
  try {
    const { location, date } = req.query;

    const pool = await sql.connect(db);
    const result = await pool.request()
      .input("Location", sql.NVarChar, location)
      .input("StartOfDay", sql.DateTime, new Date(date + " 00:00"))
      .input("EndOfDay", sql.DateTime, new Date(date + " 23:59"))
      .query(`
        SELECT EventID, EventName, EventDate
        FROM Events
        WHERE Location = @Location
          AND EventDate BETWEEN @StartOfDay AND @EndOfDay
      `);

    res.json(result.recordset);

  } catch (err) {
    console.error("getEventsByLocation Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
}

module.exports = { getEventsByLocation };


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
  
  // Check if user already signed up
  const checkResult = await pool.request()
    .input("UserID", sql.Int, userID)
    .input("EventID", sql.Int, eventID)
    .query(`
      SELECT * FROM EventSignUps
      WHERE UserID = @UserID AND EventID = @EventID
    `);

  if (checkResult.recordset.length > 0) {
    throw new Error('User already signed up for this event.');
  }

  // Insert into EventSignUps table
  await pool.request()
    .input("UserID", sql.Int, userID)
    .input("EventID", sql.Int, eventID)
    .query(`
      INSERT INTO EventSignUps(UserID, EventID)
      VALUES(@UserID, @EventID)
    `);
}

async function cancel(userID, eventID) {
  const pool = await sql.connect(db);
  await pool.request()
    .input("UserID", sql.Int, userID)
    .input("EventID", sql.Int, eventID)
    .query(`
      UPDATE EventSignUps
      SET Status = 'Cancelled'
      WHERE UserID = @UserID AND EventID = @EventID
    `);
}

async function isSignedUp(userID, eventID) {
  const pool = await sql.connect(db);
  const result = await pool.request()
    .input("UserID", sql.Int, userID)
    .input("EventID", sql.Int, eventID)
    .query(`
      SELECT * FROM EventSignUps 
      WHERE UserID = @UserID AND EventID = @EventID AND Status = 'Active'
    `);

  return result.recordset.length > 0;
}


async function updateEvent(eventID, data) {
  const pool = await sql.connect(db);
  await pool.request()
    .input("EventID", sql.Int, eventID)
    .input("EventName", sql.NVarChar(100), data.EventName)
    .input("EventDate", sql.DateTime, data.EventDate)
    .input("Location", sql.NVarChar(sql.MAX), data.EventLocation)
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
