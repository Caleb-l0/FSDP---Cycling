const pool = require("../Postgres_config");


// ======================================================
// Volunteer Signup Model
// Purpose: Handle volunteer sign ups for events
// Table: eventsignups (volunteers sign up for events)
// ======================================================


// ======================================================
// 1. Sign Up For Event
// ======================================================
async function signUpForEvent(userID, eventID) {
  // Check existing signup
  const check = await pool.query(
    `
    SELECT 1 FROM eventsignups
    WHERE userid = $1 AND eventid = $2 AND status = 'Active'
    `,
    [userID, eventID]
  );

  if (check.rows.length > 0) {
    throw new Error("User already signed up");
  }

  // Insert signup
  await pool.query(
    `
    INSERT INTO eventsignups (userid, eventid)
    VALUES ($1, $2)
    `,
    [userID, eventID]
  );

  // Increment people signup count
  await pool.query(
    `
    UPDATE events
    SET peoplesignup = peoplesignup + 1
    WHERE eventid = $1
    `,
    [eventID]
  );

  try {
    await awardVolunteerLevelBadges(userID);
  } catch (e) {
    console.error('awardVolunteerLevelBadges error:', e);
  }
}

async function awardVolunteerLevelBadges(userID) {
  const userId = Number(userID);
  if (!userId) return;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const countRes = await client.query(
      `
      SELECT COUNT(*)::int AS total
      FROM eventsignups
      WHERE userid = $1 AND status = 'Active'
      `,
      [userId]
    );

    const total = Number(countRes.rows?.[0]?.total || 0);

    let level = null;
    if (total >= 20) level = 'Diamond Volunteer';
    else if (total >= 10) level = 'Gold Volunteer';
    else if (total >= 5) level = 'Bronze Volunteer';

    if (level) {
      await client.query(
        `
        UPDATE users
        SET level = $2
        WHERE id = $1
        `,
        [userId, level]
      );
    }

    const badgesToAward = [];
    if (total >= 5) badgesToAward.push({
      badgetype: 'level',
      badgename: 'Bronze Volunteer',
      description: 'Signed up for 5 volunteer events',
      requirementvalue: 5,
      iconurl: 'https://cdn-icons-png.flaticon.com/512/2583/2583319.png'
    });
    if (total >= 10) badgesToAward.push({
      badgetype: 'level',
      badgename: 'Gold Volunteer',
      description: 'Signed up for 10 volunteer events',
      requirementvalue: 10,
      iconurl: 'https://cdn-icons-png.flaticon.com/512/2583/2583434.png'
    });
    if (total >= 20) badgesToAward.push({
      badgetype: 'level',
      badgename: 'Diamond Volunteer',
      description: 'Signed up for 20 volunteer events',
      requirementvalue: 20,
      iconurl: 'https://cdn-icons-png.flaticon.com/512/2583/2583340.png'
    });

    for (const b of badgesToAward) {
      const existing = await client.query(
        `
        SELECT badgeid
        FROM badges
        WHERE LOWER(TRIM(badgetype)) = LOWER(TRIM($1))
          AND LOWER(TRIM(badgename)) = LOWER(TRIM($2))
        LIMIT 1
        `,
        [b.badgetype, b.badgename]
      );

      let badgeId = existing.rows?.[0]?.badgeid;

      if (!badgeId) {
        const inserted = await client.query(
          `
          INSERT INTO badges (badgetype, badgename, description, iconurl, requirementvalue, isactive)
          VALUES ($1, $2, $3, $4, $5, TRUE)
          RETURNING badgeid
          `,
          [b.badgetype, b.badgename, b.description, b.iconurl, b.requirementvalue]
        );
        badgeId = inserted.rows?.[0]?.badgeid;
      }

      if (badgeId) {
        await client.query(
          `
          INSERT INTO userbadges (userid, badgeid, source, status)
          VALUES ($1, $2, 'system', 'active')
          ON CONFLICT (userid, badgeid)
          DO UPDATE SET status = 'active'
          `,
          [userId, badgeId]
        );
      }
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}


// ======================================================
// 2. Cancel Signup
// ======================================================
async function cancelSignup(userID, eventID) {
  const result = await pool.query(
    `
    UPDATE eventsignups
    SET status = 'Cancelled'
    WHERE userid = $1 AND eventid = $2 AND status = 'Active'
    RETURNING *
    `,
    [userID, eventID]
  );

  if (result.rowCount > 0) {
    await pool.query(
      `
      UPDATE events
      SET peoplesignup = GREATEST(peoplesignup - 1, 0)
      WHERE eventid = $1
      `,
      [eventID]
    );
  }

  return result;
}


// ======================================================
// 3. Check If User Already Signed Up
// ======================================================
async function isSignedUp(userID, eventID) {
  const result = await pool.query(
    `
    SELECT 1
    FROM eventsignups
    WHERE userid = $1 AND eventid = $2 AND status = 'Active'
    `,
    [userID, eventID]
  );

  return result.rows.length > 0;
}

async function checkIn(userId, eventId) {
  const uid = Number(userId);
  const eid = Number(eventId);
  if (!uid || !eid) throw new Error("Invalid userId/eventId");

  const res = await pool.query(
    `
    UPDATE eventsignups
    SET checkin_time = COALESCE(checkin_time, NOW())
    WHERE userid = $1
      AND eventid = $2
      AND status = 'Active'
    RETURNING signupid, eventid, userid, checkin_time, checkout_time
    `,
    [uid, eid]
  );

  if (res.rows.length === 0) {
    throw new Error("No active signup found for this user and event");
  }

  return res.rows[0];
}

async function checkOut(userId, eventId) {
  const uid = Number(userId);
  const eid = Number(eventId);
  if (!uid || !eid) throw new Error("Invalid userId/eventId");

  const res = await pool.query(
    `
    UPDATE eventsignups
    SET checkout_time = COALESCE(checkout_time, NOW())
    WHERE userid = $1
      AND eventid = $2
      AND status = 'Active'
      AND checkin_time IS NOT NULL
    RETURNING signupid, eventid, userid, checkin_time, checkout_time
    `,
    [uid, eid]
  );

  if (res.rows.length === 0) {
    throw new Error("Cannot check out: no active signup with check-in found");
  }

  return res.rows[0];
}


// ======================================================
// 4. Get All Signed-Up Events For A User
// ======================================================
async function getSignedUpEvents(userId) {
  const result = await pool.query(
    `
    SELECT 
      e.eventid,
      e.eventname,
      e.eventdate,
      e.description,
      e.location,      
      e.requiredvolunteers,
      e.status,
      es.signupdate,
      es.status AS signupstatus
    FROM eventsignups es
    INNER JOIN events e ON es.eventid = e.eventid
    WHERE es.userid = $1 AND es.status = 'Active'
    ORDER BY e.eventdate ASC
    `,
    [userId]
  );

  return result.rows;
}


// ======================================================
module.exports = {
  signUpForEvent,
  cancelSignup,
  isSignedUp,
  getSignedUpEvents,
  checkIn,
  checkOut
};

