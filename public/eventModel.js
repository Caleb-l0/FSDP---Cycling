const { poolPromise, sql } = require('./db');

async function getAllEvents() {
  const pool = await poolPromise;
  const result = await pool.request().query('SELECT * FROM Events');
  return result.recordset;
}

async function signUpForEvent(eventId, userId) {
  const pool = await poolPromise;

  // check duplicate
  const check = await pool.request()
    .input('EventID', sql.Int, eventId)
    .input('UserID', sql.Int, userId)
    .query(`
      SELECT * FROM EventSignUps 
      WHERE EventID = @EventID AND UserID = @UserID
    `);

  if (check.recordset.length > 0) {
    throw new Error('User already signed up for this event.');
  }

  // insert
  await pool.request()
    .input('EventID', sql.Int, eventId)
    .input('UserID', sql.Int, userId)
    .query(`
      INSERT INTO EventSignUps (EventID, UserID)
      VALUES (@EventID, @UserID)
    `);
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
        e.Location,            -- ✅ FIXED FIELD NAME
        e.RequiredVolunteers,
        e.Status,
        es.SignUpDate,
        es.Status AS SignUpStatus
      FROM EventSignUps es
      INNER JOIN Events e ON es.EventID = e.EventID
      WHERE es.UserID = @UserID AND es.Status = 'Active'
      ORDER BY e.EventDate ASC
    `);
  return result.recordset;
}


module.exports = { getAllEvents, signUpForEvent, getSignedUpEvents };

