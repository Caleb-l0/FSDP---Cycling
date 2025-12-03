


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
// 6. Check if Event Has Bookings
// ----------------------------
async function canDeleteEvent(eventID) {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) AS countbookings
       FROM eventbookings
       WHERE eventid = $1`,
      [eventID]
    );

    const count = Number(result.rows[0].countbookings);
    return count === 0;

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
      return { canDelete: false };
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
module.exports = {
  getAllEvents,
  createEvent,
  assignEventToOrgan,
  getEventLocation,
  checkOrganizationExists,
  canDeleteEvent,
  deleteEvent,
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