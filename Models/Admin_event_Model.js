const sql = require("mssql");
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
    if (organizationID === null || organizationID === undefined || organizationID === NaN ) {
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