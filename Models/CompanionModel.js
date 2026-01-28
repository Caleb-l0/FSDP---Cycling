const pool = require("../Postgres_config");

function safeJson(value) {
  if (value == null) return null;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function buildMapLink(location) {
  if (!location) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}

async function upsertUserProfileCache({ userId, preferredLocation, lastLat, lastLng }) {
  const uid = Number(userId);
  if (!uid) return null;

  const res = await pool.query(
    `
    INSERT INTO user_profile_cache (userid, preferred_location, last_lat, last_lng, updatedat)
    VALUES ($1, $2, $3, $4, NOW())
    ON CONFLICT (userid)
    DO UPDATE SET
      preferred_location = COALESCE(EXCLUDED.preferred_location, user_profile_cache.preferred_location),
      last_lat = COALESCE(EXCLUDED.last_lat, user_profile_cache.last_lat),
      last_lng = COALESCE(EXCLUDED.last_lng, user_profile_cache.last_lng),
      updatedat = NOW()
    RETURNING *
    `,
    [
      uid,
      preferredLocation || null,
      Number.isFinite(Number(lastLat)) ? Number(lastLat) : null,
      Number.isFinite(Number(lastLng)) ? Number(lastLng) : null
    ]
  );

  return res.rows[0] || null;
}

async function getUserProfileCache(userId) {
  const uid = Number(userId);
  if (!uid) return null;

  const res = await pool.query(
    `
    SELECT userid, preferred_location, last_lat, last_lng, updatedat
    FROM user_profile_cache
    WHERE userid = $1
    `,
    [uid]
  );

  const row = res.rows[0];
  if (!row) return null;

  return {
    userId: row.userid,
    preferredLocation: row.preferred_location,
    lastLat: row.last_lat,
    lastLng: row.last_lng,
    updatedAt: row.updatedat
  };
}

async function logTelemetry({ userId, type, payload }) {
  const uid = userId == null ? null : Number(userId);
  await pool.query(
    `
    INSERT INTO telemetry_events (userid, type, payload)
    VALUES ($1, $2, $3)
    `,
    [Number.isFinite(uid) ? uid : null, type, payload != null ? JSON.stringify(payload) : null]
  );
}

async function getUpcomingVolunteerEvents({ preferredLocation, limit = 20 }) {
  const lim = Math.max(1, Math.min(Number(limit) || 20, 50));

  const res = await pool.query(
    `
    SELECT
      e.eventid,
      e.eventname,
      e.eventdate,
      e.location,
      e.description,
      e.status,
      e.requiredvolunteers,
      (
        SELECT COUNT(*)::int
        FROM eventsignups es
        WHERE es.eventid = e.eventid AND es.status = 'Active'
      ) AS volunteer_signup_count
    FROM events e
    WHERE e.status = 'Upcoming'
      AND e.eventdate > NOW()
      AND e.organizationid IS NOT NULL
      AND ($1::text IS NULL OR e.location ILIKE '%' || $1 || '%')
    ORDER BY e.eventdate ASC
    LIMIT $2
    `,
    [preferredLocation || null, lim]
  );

  return res.rows || [];
}

async function getEventHeadForEvent(eventId) {
  const eid = Number(eventId);
  if (!eid) return null;

  const res = await pool.query(
    `
    SELECT
      eb.session_head_name AS name,
      eb.session_head_contact AS contact,
      eb.session_head_email AS email,
      eb.session_head_profile AS profile
    FROM eventbookings eb
    WHERE eb.eventid = $1
      AND eb.status = 'Approved'
    ORDER BY eb.reviewdate DESC NULLS LAST, eb.createdat DESC
    LIMIT 1
    `,
    [eid]
  );

  const row = res.rows[0];
  if (!row) return null;

  return {
    name: row.name || null,
    contact: row.contact || null,
    email: row.email || null,
    profile: row.profile || null
  };
}

async function createElderlySignup({ elderlyId, eventId, specialNeeds, notes }) {
  const uid = Number(elderlyId);
  const eid = Number(eventId);
  if (!uid || !eid) throw new Error("Invalid elderlyId or eventId");

  const check = await pool.query(
    `
    SELECT 1
    FROM eventsignups
    WHERE userid = $1 AND eventid = $2 AND status = 'Active'
    `,
    [uid, eid]
  );

  if (check.rows.length > 0) {
    throw new Error("User already signed up for this event.");
  }

  const res = await pool.query(
    `
    INSERT INTO eventsignups (eventid, userid, status, special_needs, notes, signup_source)
    VALUES ($1, $2, 'Active', $3, $4, 'elderly')
    RETURNING signupid, eventid, userid, signupdate, status, special_needs, notes, signup_source
    `,
    [eid, uid, specialNeeds != null ? JSON.stringify(specialNeeds) : null, notes || null]
  );

  return res.rows[0];
}

async function getNextRideForElderly(elderlyId) {
  const uid = Number(elderlyId);
  if (!uid) return null;

  const res = await pool.query(
    `
    SELECT
      es.signupid,
      es.signupdate,
      es.special_needs,
      es.notes,
      es.signup_source,
      e.eventid,
      e.eventname,
      e.eventdate,
      e.location,
      e.status
    FROM eventsignups es
    INNER JOIN events e ON e.eventid = es.eventid
    WHERE es.userid = $1
      AND es.status = 'Active'
      AND e.eventdate >= NOW()
    ORDER BY e.eventdate ASC
    LIMIT 1
    `,
    [uid]
  );

  const row = res.rows[0];
  if (!row) return null;

  const head = await getEventHeadForEvent(row.eventid);
  const mapLink = buildMapLink(row.location);

  return {
    signupId: row.signupid,
    eventId: row.eventid,
    eventName: row.eventname,
    eventDate: row.eventdate,
    location: row.location,
    status: row.status,
    mapLink,
    eventHead: head,
    specialNeeds: safeJson(row.special_needs),
    notes: row.notes || null,
    signupSource: row.signup_source || null,
    signedUpAt: row.signupdate
  };
}

module.exports = {
  upsertUserProfileCache,
  getUserProfileCache,
  logTelemetry,
  getUpcomingVolunteerEvents,
  getEventHeadForEvent,
  createElderlySignup,
  getNextRideForElderly,
  buildMapLink
};
