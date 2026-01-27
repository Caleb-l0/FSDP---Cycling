// Test to check what's actually in the eventsignups table
const pool = require('./Postgres_config');

async function checkEventSignups(eventID) {
  try {
    console.log('Checking signups for eventID:', eventID);
    
    // Check all signups for this event
    const allSignups = await pool.query(
      'SELECT * FROM eventsignups WHERE eventid = $1',
      [eventID]
    );
    
    console.log('All signups for event', eventID, ':', allSignups.rows);
    console.log('Total signups:', allSignups.rows.length);
    
    // Check signups with user details
    const signupsWithUsers = await pool.query(
      `
      SELECT 
        es.*,
        u.name,
        u.email,
        u.phone,
        u.role
      FROM eventsignups es
      JOIN users u ON es.userid = u.id
      WHERE es.eventid = $1
      `,
      [eventID]
    );
    
    console.log('Signups with user details:', signupsWithUsers.rows);
    
    // Check the specific query we're using in the check-in function
    const checkInQuery = await pool.query(
      `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.role,
        es.signupdate,
        es.signupid
      FROM eventsignups es
      JOIN users u ON es.userid = u.id
      WHERE es.eventid = $1 
        AND (es.status IS NULL OR es.status = 'Active' OR es.status = 'active')
      ORDER BY es.signupdate ASC
      `,
      [eventID]
    );
    
    console.log('Check-in query results:', checkInQuery.rows);
    
  } catch (error) {
    console.error('Error checking signups:', error);
  } finally {
    process.exit(0);
  }
}

// Get eventID from command line argument
const eventID = process.argv[2] || 1;
checkEventSignups(eventID);
