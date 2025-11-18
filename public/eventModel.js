const { poolPromise, sql } = require('./db');

async function getAllEvents() {
  const pool = await poolPromise;
  const result = await pool.request().query('SELECT * FROM Events');
  return result.recordset;
}

async function signUpForEvent(eventId, userId) {
  const pool = await poolPromise;

  const checkQuery = `
    SELECT * FROM EventSignUps
    WHERE EventID = @EventID AND UserID = @UserID
  `;
  const checkResult = await pool.request()
    .input('EventID', sql.Int, eventId)
    .input('UserID', sql.Int, userId)
    .query(checkQuery);

  if (checkResult.recordset.length > 0) {
    throw new Error('User already signed up for this event.');
  }

  const insertQuery = `
    INSERT INTO EventSignUps (EventID, UserID)
    VALUES (@EventID, @UserID)
  `;
  await pool.request()
    .input('EventID', sql.Int, eventId)
    .input('UserID', sql.Int, userId)
    .query(insertQuery);
}

async function getSignedUpEvents(userId) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('UserID', sql.Int, userId)
    .query(`
      SELECT 
        e.EventID,
        e.EventName,
        e.EventDate,
        e.Description,
        e.Location,
        e.RequiredVolunteers,
        e.PeopleSignUp,
        e.Status,
        es.SignUpDate,
        es.Status AS SignUpStatus
      FROM EventSignUps es
      INNER JOIN Events e ON es.EventID = e.EventID
      WHERE es.UserID = @UserID
      ORDER BY e.EventDate ASC
    `);
  return result.recordset;
}

module.exports = { getAllEvents, signUpForEvent, getSignedUpEvents };

