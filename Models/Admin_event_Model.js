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


    const result = await pool.request()
      
      .input("OrganizationID", sql.Int, null)
      .input("EventName", sql.NVarChar(100), eventData.EventName)
      .input("EventDate", sql.DateTime, eventData.EventDate)
      .input("Description", sql.NVarChar(sql.MAX), eventData.Description)
      .input("RequiredVolunteers", sql.Int, eventData.RequiredVolunteers)
      .input("PeopleSignUp", sql.Int, eventData.PeopleSignUp)
      .input("VolunteerSignUp", sql.Int, 0)
      .input("MaximumParticipant",sql.Int,eventData.MaximumParticipant)
      .input("Status", sql.NVarChar(20), eventData.Status)
      .input("Location", sql.NVarChar(20), eventData.Location)
      .query(`
        INSERT INTO Events
        (OrganizationID, Location,EventName, EventDate, Description,
         RequiredVolunteers,VolunteerSignUp,MaximumParticipant, PeopleSignUp, Status)
        OUTPUT inserted.*
        VALUES
        (@OrganizationID, @Location,@EventName, @EventDate, @Description,
         @RequiredVolunteers, @VolunteerSignUp,@MaximumParticipant,@PeopleSignUp, @Status)
      `);


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
        SELECT Location
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