const sql = require("mssql");
const db = require("../dbconfig");
const EventModel = require("../Models/EventModel");





async function getEventById(req, res) {
  try {
    const event = await EventModel.getEventById(req.params.id);
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


// for volunteer
async function signup(req, res) {
  try {
    await EventModel.signup(req.user.id, req.params.eventID);
    res.json({ message: "Signed up" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
}

async function cancel(req, res) {
  try {
    await EventModel.cancel(req.user.id, req.params.eventID);
    res.json({ message: "Canceled" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
}

async function isSignedUp(req, res) {
  try {
    const signedUp = await EventModel.isSignedUp(req.query.userID, req.query.eventID);
    res.json({ signedUp });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
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






module.exports = {
  getEventById,
  deleteEvent,
  checkAssigned,
  signup,
  cancel,
  isSignedUp,
  updateEvent,
};
