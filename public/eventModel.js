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

module.exports = { getAllEvents, signUpForEvent };

