const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const AdminEventModel = require("../Models/Admin_event_Model");
const requestModel = require('../Models/GetRequestModel')


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

    const newEvent = await AdminEventModel.createEvent(eventData);
    await requestModel.approveRequest(eventData.VolunteerRequestID);

    res.status(201).json({
      message: "Event created successfully",
      event: newEvent
    });

  } catch (error) {
    console.error("Error in createEvent controller:", error);
    res.status(500).json({ message: "Server error", error });
  }
}

async function assignEventToOrgan(req,res){
   try {
    const eventData = req.body;



    const newEvent = await AdminEventModel.assignEventToOrgan(eventData);
  

    res.status(201).json({
      message: "Assign Organization to the event succeed!",
      newEvent,
    });

  } catch (error) {
    console.error("Error in Assign event to organisation controller:", error);
    res.status(500).json({ message: "Server error", error });
  }
}

async function getEventLocation(req, res) {
  try {
    const { eventID } = req.params;

    const location = await AdminEventModel.getEventLocation(eventID);

    res.json({
      success: true,
      data: location  // { Location: "Jurong East Hall" }
    });

  } catch (error) {
    console.error("Controller getEventLocation Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error
    });
  }
}

const AdminEventModel = require("../Models/Admin_event_Model");
const requestModel = require('../Models/GetRequestModel');



async function deleteEvent(req, res) {
  try {
    const { eventID } = req.params;
    const id = parseInt(eventID, 10);

    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid eventID" });
    }

    const result = await AdminEventModel.deleteEvent(id);

    if (!result.canDelete) {
      return res.status(400).json({
        canDelete: false,
        message: "Cannot delete this event because an organisation has already signed up."
      });
    }

    return res.status(200).json({
      canDelete: true,
      message: "Event deleted successfully"
    });

  } catch (error) {
    console.error("Error in deleteEvent controller:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
}






module.exports = { getAllEvents,createEvent,assignEventToOrgan,getEventLocation,deleteEvent,canDeleteEvent };