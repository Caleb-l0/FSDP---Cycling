const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const AdminEventModel = require("../Models/Admin_event_Model");
const OrganizationRequestModel = require('../Models/OrganizationRequestModel')




async function getAllEvents(req, res) {
    try {
        const events = await AdminEventModel.getAllEvents();
        res.status(200).json(events);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
}

async function createEvent(req, res) {
  let eventData;
  try {
    eventData = req.body;
    console.log("Received event data:", eventData);

    if (!eventData.EventName || !eventData.EventDate) {
      return res.status(400).json({ message: "Missing required fields: EventName and EventDate are required" });
    }
  console.log("RAW OrganizationID =", eventData.OrganizationID);
    // OrganizationID is optional (can be null), but if provided, must be valid and exist
  if (eventData.OrganizationID !== undefined && 
    eventData.OrganizationID !== null && 
    !Number.isNaN(Number(eventData.OrganizationID))) {
    
    const orgID = parseInt(eventData.OrganizationID);
    
    const orgExists = await AdminEventModel.checkOrganizationExists(orgID);
    if (!orgExists) {
      return res.status(400).json({
        message: `OrganizationID ${orgID} does not exist in the database. Please provide a valid OrganizationID or leave it empty.`
      });
    }

    eventData.OrganizationID = orgID;
}

    const newEvent = await AdminEventModel.createEvent(eventData);
    
    // Only approve request if VolunteerRequestID exists
    if (eventData.VolunteerRequestID) {
      try {
        await OrganizationRequestModel.approveRequest(eventData.VolunteerRequestID);
      } catch (approveError) {
        console.warn("Failed to approve request:", approveError);
        // Don't fail the event creation if request approval fails
      }
    }

    res.status(201).json({
      message: "Event created successfully",
      event: newEvent
    });

  } catch (error) {
    console.error("Error in createEvent controller:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      eventData: eventData || "Not available"
    });
    res.status(500).json({ 
      message: "Server error", 
      error: error.message || String(error),
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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
      data: location  // { EventLocation: "Jurong East Hall" }
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
        message: "Cannot delete this event because it has bookings or participants signed up."
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






module.exports = { getAllEvents,createEvent,assignEventToOrgan,getEventLocation,deleteEvent };