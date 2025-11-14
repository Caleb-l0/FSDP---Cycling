const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const AdminEventModel = require("../Models/Admin_event_Model");



async function getAllEvents(req, res) {
    try {
        const events = await AdminEventModel.getAllEvents();
        res.status(200).json(events);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
}

async function createEvent(req, res) {
  try {
    const eventData = req.body;

    if (!eventData.EventName || !eventData.EventDate || !eventData.OrganizationID) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newEvent = await eventsModel.createEvent(eventData);

    res.status(201).json({
      message: "Event created successfully",
      event: newEvent
    });

  } catch (error) {
    console.error("Error in createEvent controller:", error);
    res.status(500).json({ message: "Server error", error });
  }
}





module.exports = { getAllEvents,createEvent };