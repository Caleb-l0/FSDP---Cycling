const sql = require("mssql");
const db = require("../dbconfig");
const EventModel = require("../Models/EventModel");
const VolunteerSignupModel = require("../Models/VolunteerSignupModel");
const { get } = require("mongoose");


// Get events by location + specific date (day-based)
async function getEventsByLocation(req, res) {
  try {
    const { location, date } = req.query;

    const pool = await sql.connect(db);
    const result = await pool.request()
     .input("Location", sql.NVarChar, location || "")
      .input("StartOfDay", sql.DateTime, new Date(date + " 00:00:00"))
      .input("EndOfDay", sql.DateTime, new Date(date + " 23:59:59"))
      .query(`
        SELECT EventID, EventName, EventDate
        FROM Events
        WHERE Location = @Location
        AND EventDate BETWEEN @StartOfDay AND @EndOfDay
      `);

    res.json(result.recordset);

  } catch (err) {
    console.error("getEventsByLocation Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
}





async function getEventById(req, res) {
  try {
    // Route uses :eventID, so use req.params.eventID (fallback to req.params.id for compatibility)
    const eventId = req.params.eventID || req.params.id;
    const event = await EventModel.getEventById(eventId);
    res.status(200).json(event);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
}



async function checkAssigned(req, res) {
  try {
    const eventID = req.params.eventID;

    const result = await EventModel.checkAssigned(eventID);

    res.json({ assigned: result });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
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


// for volunteer (using VolunteerSignupModel)
async function signup(req, res) {
  try {
    await VolunteerSignupModel.signUpForEvent(req.user.id, req.params.eventID);
    res.json({ message: "Signed up" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
}

async function cancel(req, res) {
  try {
    await VolunteerSignupModel.cancelSignup(req.user.id, req.params.eventID);
    res.json({ message: "Canceled" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
}

async function isSignedUp(req, res) {
  try {
    const userID = req.user.id;              
    const { eventID } = req.params;          

    const signedUp = await VolunteerSignupModel.isSignedUp(userID, eventID);

    res.json({ signedUp });
  } catch (error) {
    console.error("isSignedUp error:", error);
    res.status(500).json({ message: "Server Error" });
  }
}


// for admin
async function updateEvent(req, res) {
  try {
    const result = await EventModel.updateEvent(req.params.eventID, req.body);
    res.json({ message: "Event updated", result });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
}


async function cancelSignup(req, res) {
  try {
    const userId = req.user.id;
    const { eventId } = req.params;

    const result = await VolunteerSignupModel.cancelSignup(userId, eventId);

    if (result.rowCount === 0) {
      return res.status(400).json({
        message: "No active signup found to cancel"
      });
    }

    return res.json({
      message: "Signup cancelled successfully"
    });

  } catch (err) {
    console.error("Cancel signup error:", err);
    res.status(500).json({ message: "Server error" });
  }
}




module.exports = {
  getEventById,
  deleteEvent,
  checkAssigned,
  signup,
  cancel,
  isSignedUp,
  updateEvent,
  getEventsByLocation,
  cancelSignup,
};
