


const pool = require("../Postgres_config");

// ----------------------------
// 1. Get All Events
// ----------------------------
async function getAllEvents() {
  const result = await pool.query(`SELECT * FROM events ORDER BY eventid ASC`);
  return result.rows;
}

// ----------------------------
// 2. Create Event
// ----------------------------
async function createEvent(eventData) {
  try {
    const query = `
      INSERT INTO events (
        location, organizationid, eventname, eventdate, description,
        requiredvolunteers, maximumparticipant, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      eventData.Location || null,
      eventData.OrganizationID || null,
      eventData.EventName,
      eventData.EventDate,
      eventData.Description || "",
      eventData.RequiredVolunteers,
      eventData.MaximumParticipant,
      eventData.Status || "Upcoming",
    ];

    const result = await pool.query(query, values);
    return result.rows[0];

  } catch (err) {
    console.error("Error creating event model:", err);
    throw err;
  }
}

// ----------------------------
// 3. Assign Event to Organization
// ----------------------------
async function assignEventToOrgan(eventData) {
  try {
    const query = `
      UPDATE events
      SET organizationid = $1,
          updatedat = NOW()
      WHERE eventid = $2
      RETURNING *
    `;

    const values = [
      eventData.OrganizationID,
      eventData.EventID
    ];

    const result = await pool.query(query, values);
    return result.rows[0];

  } catch (err) {
    console.error("Error updating event:", err);
    throw err;
  }
}

// ----------------------------
// 4. Check if Organization Exists
// ----------------------------
async function checkOrganizationExists(organizationID) {
  try {
    if (
      organizationID === null ||
      organizationID === undefined ||
      Number.isNaN(organizationID)
    ) {
      return true;
    }

    const result = await pool.query(
      `SELECT organizationid FROM organizations WHERE organizationid = $1`,
      [organizationID]
    );

    return result.rowCount > 0;

  } catch (err) {
    console.error("Error checking organization:", err);
    throw err;
  }
}

// ----------------------------
// 5. Get Event Location
// ----------------------------
async function getEventLocation(eventID) {
  try {
    const result = await pool.query(
      `SELECT location FROM events WHERE eventid = $1`,
      [eventID]
    );
    return result.rows[0] || null;

  } catch (err) {
    console.error("Model getEventLocation Error:", err);
    throw err;
  }
}

// ----------------------------
// 6. Check if Event Can Be Deleted (no bookings AND no participants)
// ----------------------------
async function canDeleteEvent(eventID) {
  try {
    // Check if event has bookings
    const bookingResult = await pool.query(
      `SELECT COUNT(*) AS countbookings
       FROM eventbookings
       WHERE eventid = $1 AND status = 'Approved'`,
      [eventID]
    );

    const bookingCount = Number(bookingResult.rows[0].countbookings);
    
    // Check if event has participants
    const eventResult = await pool.query(
      `SELECT COALESCE(peoplesignup, 0) AS participants
       FROM events
       WHERE eventid = $1`,
      [eventID]
    );

    const participants = Number(eventResult.rows[0]?.participants || 0);

    // Can delete if no approved bookings AND no participants
    return bookingCount === 0 && participants === 0;

  } catch (err) {
    console.error("Model canDeleteEvent Error:", err);
    throw err;
  }
}

// ----------------------------
// 7. Delete Event
// ----------------------------
async function deleteEvent(eventID) {
  try {
    const canDelete = await canDeleteEvent(eventID);
    if (!canDelete) {
      return { canDelete: false, message: "Cannot delete event with bookings or participants" };
    }

    await pool.query(
      `DELETE FROM events WHERE eventid = $1`,
      [eventID]
    );

    return { canDelete: true };

  } catch (err) {
    console.error("Model deleteEvent Error:", err);
    throw err;
  }
}

// ----------------------------
// 8. Get Events Eligible for Auto-Delete (no participants, day before event)
// ----------------------------
async function getEventsForAutoDelete() {
  try {
    const result = await pool.query(
      `
      SELECT eventid, eventname, eventdate
      FROM events
      WHERE organizationid IS NULL
        AND (peoplesignup IS NULL OR peoplesignup = 0)
        AND eventdate > NOW() + INTERVAL '1 day'
        AND eventdate < NOW() + INTERVAL '2 days'
        AND status = 'Upcoming'
        AND NOT EXISTS (
          SELECT 1 
          FROM eventbookings 
          WHERE eventid = events.eventid 
            AND status = 'Approved'
        )
      `
    );

    return result.rows;
  } catch (err) {
    console.error("getEventsForAutoDelete Error:", err);
    throw err;
  }
}

// ----------------------------
// 9. Auto-Delete Events (run daily)
// ----------------------------
async function autoDeleteEventsWithNoParticipants() {
  try {
    const eventsToDelete = await getEventsForAutoDelete();
    const deletedEvents = [];

    for (const event of eventsToDelete) {
      const result = await deleteEvent(event.eventid);
      if (result.canDelete) {
        deletedEvents.push(event);
      }
    }

    return deletedEvents;
  } catch (err) {
    console.error("autoDeleteEventsWithNoParticipants Error:", err);
    throw err;
  }
}

// ----------------------------
module.exports = {
  getAllEvents,
  createEvent,
  assignEventToOrgan,
  getEventLocation,
  checkOrganizationExists,
  canDeleteEvent,
  deleteEvent,
  getEventsForAutoDelete,
  autoDeleteEventsWithNoParticipants
};







/* const sql = require("mssql");
const db = require("../dbconfig");




async function getAllEvents() {
    await sql.connect(db);
    const result = await sql.query`SELECT * FROM Events`;
    return result.recordset;
}

async function createEvent(eventData) {
  let pool;
  try {
    pool = await sql.connect(db);
    const request = pool.request();

    if (eventData.OrganizationID !== undefined && eventData.OrganizationID !== null) {
      request.input("OrganizationID", sql.Int, eventData.OrganizationID);
    } else {
      request.input("OrganizationID", sql.Int, null);
    }

    request.input("EventName", sql.NVarChar(100), eventData.EventName);
    request.input("EventDate", sql.DateTime, eventData.EventDate);
    request.input("MaximumParticipant", sql.Int, eventData.MaximumParticipant);
    request.input("Description", sql.NVarChar(sql.MAX), eventData.Description || '');
    request.input("RequiredVolunteers", sql.Int, eventData.RequiredVolunteers);
    request.input("Status", sql.NVarChar(20), eventData.Status || 'Upcoming');

    const locationValue = (eventData.Location && eventData.Location.trim() !== '')
      ? eventData.Location.trim()
      : null;
    request.input("Location", sql.NVarChar(sql.MAX), locationValue);

    const query = `
      INSERT INTO Events
      (Location,OrganizationID, EventName, EventDate, Description, 
       RequiredVolunteers, MaximumParticipant,Status)
      OUTPUT inserted.*
      VALUES
      ( @Location,@OrganizationID, @EventName, @EventDate, @Description,
       @RequiredVolunteers, @MaximumParticipant,@Status)
    `;
    const result = await request.query(query);
    return result.recordset[0];
  } catch (err) {
    console.error("Error creating event model:", err);
    throw err;
  }
}

async function assignEventToOrgan(eventData) {
  try {
    const pool = await sql.connect(db);
    
    const result = await pool.request()
      .input("EventID", sql.Int, eventData.EventID)
      .input("OrganizationID", sql.Int, eventData.OrganizationID)
      .query(`
        UPDATE Events
        SET OrganizationID = @OrganizationID,
            UpdatedAt = GETDATE()
        WHERE EventID = @EventID
      `);

    return { message: "Event updated successfully" };

  } catch (err) {
    console.error("Error updating event:", err);
    throw err;
  }
}
async function checkOrganizationExists(organizationID) {
  try {
    // If empty or invalid → treat as valid (no organization needed)
    if (
      organizationID === null || 
      organizationID === undefined || 
      Number.isNaN(organizationID)
    ) {
      return true;
    }

    const pool = await sql.connect(db);
    const result = await pool.request()
      .input("OrganizationID", sql.Int, organizationID)
      .query(`
        SELECT OrganizationID
        FROM Organizations
        WHERE OrganizationID = @OrganizationID
      `);

    return result.recordset.length > 0;

  } catch (err) {
    console.error("Error checking organization:", err);
    throw err;
  }
}

async function getEventLocation(eventID) {
  try {
    const pool = await sql.connect(db);
    const result = await pool.request()
      .input("EventID", sql.Int, eventID)
      .query(`SELECT Location FROM Events WHERE EventID = @EventID`);
    return result.recordset[0];
  } catch (err) {
    console.error("Model getEventLocation Error:", err);
    throw err;
  }
}


// ------------------

async function checkAssigned(req, res) {
  try {
    const assigned = await EventModel.checkAssigned(req.params.eventID);
    res.json({ assigned });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
}

async function deleteEvent(req, res) {
  try {
    await EventModel.deleteEvent(req.params.eventID);
    res.json({ message: "Event deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
}


async function canDeleteEvent(eventID) {
  try {
    const pool = await sql.connect(db);

    const result = await pool.request()
      .input("EventID", sql.Int, eventID)
      .query(`
        SELECT COUNT(*) AS CountBookings
        FROM EventBookings
        WHERE EventID = @EventID
      `);

    const count = result.recordset[0].CountBookings;
    return count === 0;   

  } catch (err) {
    console.error("Model canDeleteEvent Error:", err);
    throw err;
  }
}

async function deleteEvent(eventID) {
  try {
    const pool = await sql.connect(db);

   
    const canDelete = await canDeleteEvent(eventID);
    if (!canDelete) {
      return { canDelete: false };
    }

    await pool.request()
      .input("EventID", sql.Int, eventID)
      .query(`
        DELETE FROM Events
        WHERE EventID = @EventID
      `);

    return { canDelete: true };

  } catch (err) {
    console.error("Model deleteEvent Error:", err);
    throw err;
  }
}

module.exports = { getAllEvents,createEvent, assignEventToOrgan,getEventLocation,checkAssigned,deleteEvent,canDeleteEvent,deleteEvent,checkOrganizationExists};
*/