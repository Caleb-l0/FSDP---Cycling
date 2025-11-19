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
    console.log("Attempting to connect to database...");
    pool = await sql.connect(db);
    console.log("Database connected successfully");

    const request = pool.request();
    
    // Handle OrganizationID - can be null
    if (eventData.OrganizationID !== undefined && eventData.OrganizationID !== null) {
      request.input("OrganizationID", sql.Int, eventData.OrganizationID);
      console.log("OrganizationID:", eventData.OrganizationID);
    } else {
      request.input("OrganizationID", sql.Int, null);
      console.log("OrganizationID: null");
    }

    request.input("EventName", sql.NVarChar(100), eventData.EventName);
    request.input("EventDate", sql.DateTime, eventData.EventDate);
    request.input("Description", sql.NVarChar(sql.MAX), eventData.Description || '');
    request.input("RequiredVolunteers", sql.Int, eventData.RequiredVolunteers);
    request.input("Status", sql.NVarChar(20), eventData.Status || 'Upcoming');
    
    // Always include EventLocation (can be null) - matches SQL file structure
    const locationValue = (eventData.EventLocation && eventData.EventLocation.trim() !== '') 
      ? eventData.EventLocation.trim() 
      : null;
    request.input("EventLocation", sql.NVarChar(sql.MAX), locationValue);
    console.log("EventLocation value:", locationValue);

    console.log("Executing query with data:", {
      EventName: eventData.EventName,
      EventDate: eventData.EventDate,
      RequiredVolunteers: eventData.RequiredVolunteers,
      OrganizationID: eventData.OrganizationID,
      EventLocation: locationValue
    });

    // Always include EventLocation column in query (matches SQL file)
    const query = `
      INSERT INTO Events
      (OrganizationID, EventName, EventDate, Description, [EventLocation],
       RequiredVolunteers, Status)
      OUTPUT inserted.*
      VALUES
      (@OrganizationID, @EventName, @EventDate, @Description, @EventLocation,
       @RequiredVolunteers, @Status)
    `;

    const result = await request.query(query);
    console.log("Query executed successfully, result:", result.recordset[0]);

    return result.recordset[0];

  } catch (err) {
    console.error("Error creating event model:", err);
    console.error("Error name:", err.name);
    console.error("Error message:", err.message);
    console.error("Error code:", err.code);
    if (err.originalError) {
      console.error("Original error:", err.originalError);
    }
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
      .query(`
        SELECT [EventLocation]
        FROM Events 
        WHERE EventID = @EventID
      `);

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