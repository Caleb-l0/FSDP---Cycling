const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const AdminEventModel = require("../Models/Admin_event_Model");
const OrganizationRequestModel = require('../Models/OrganizationRequestModel')

const transporter = require("../mailer");
const NotificationModel = require("../Models/notification_model");




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
       
      }
    }

    // Notify ALL institution users that a new event is created (email + in-app notification)
    try {
      const institutions = await AdminEventModel.getInstitutionUsers();
      if (Array.isArray(institutions) && institutions.length > 0) {
        const userIds = institutions.map(u => u.id).filter(Boolean);

        const eventName = newEvent?.eventname || newEvent?.EventName || eventData?.EventName || 'New Event';
        const eventDate = newEvent?.eventdate || newEvent?.EventDate || eventData?.EventDate;
        const eventLocation = newEvent?.location || newEvent?.Location || eventData?.Location || 'TBD';

        await NotificationModel.createNotificationsForUsers({
          userIds,
          type: 'EVENT_CREATED',
          title: 'New event created',
          message: `A new event has been created: ${eventName}.`,
          payload: {
            eventId: newEvent?.eventid || newEvent?.EventID || null,
            eventName,
            eventDate,
            eventLocation
          }
        });

        const emailSubject = `New Event Created: ${eventName}`;
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color:#16a34a;">New Event Created</h2>
            <p>Hello, this is from Cycling Without Age.</p>
            <p>A new event has been created and is open for institutions to apply.</p>
            <div style="background:#f8fafc;padding:16px;border-radius:10px;border:1px solid #e2e8f0;">
              <p><strong>Event:</strong> ${eventName}</p>
              ${eventDate ? `<p><strong>Date:</strong> ${new Date(eventDate).toLocaleString()}</p>` : ''}
              <p><strong>Location:</strong> ${eventLocation}</p>
            </div>
            <p>Please log in to your institution account to apply for this event.</p>
            <p style="color:#64748b;font-size:12px;margin-top:24px;">This is an automated email, please do not reply.</p>
          </div>
        `;

        setImmediate(async () => {
          for (const inst of institutions) {
            if (!inst.email) continue;
            try {
              await transporter.sendMail({
                to: inst.email,
                subject: emailSubject,
                html: emailHtml
              });
            } catch (e) {
              console.error('[createEvent] Failed to email institution user:', inst.email, e);
            }
          }
        });
      }
    } catch (e) {
      console.warn('[createEvent] Failed to notify institution users:', e);
    }

    // Send email notification to organisation 
    
    if (eventData.OrganizationID) {
      try {
        await AdminEventModel.sendEventNotificationToOrganization(eventData.OrganizationID, newEvent);
      } catch (emailError) {
        console.warn("Failed to send email notifications:", emailError);
     
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
    const eventId = req.body?.event_id ?? req.body?.EventID ?? req.body?.eventid ?? req.body?.EventId;
    const organizationId = req.body?.organization_id ?? req.body?.OrganizationID ?? req.body?.organizationid ?? req.body?.OrganizationId;

    const eventData = {
      EventID: eventId,
      OrganizationID: organizationId
    };

const result = await AdminEventModel.assignEventToOrgan(eventData);
const event = result?.event;
const booking = result?.booking;

if (event?.organizationid) {
  await AdminEventModel.sendEventNotificationToOrganization(event.organizationid, event);
}


res.status(201).json({
  message: "Assign Organization to the event succeed!",
  event,
  booking
});
    try {
      await AdminEventModel.sendEventOpenNotificationToVolunteers(newEvent);
    } catch (emailError) {
      console.warn('Failed to send volunteer open signup emails:', emailError);
    }

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

    // Check if event exists first
    const eventCheck = await AdminEventModel.getEventById(id);
    if (!eventCheck) {
      return res.status(404).json({ message: "Event not found" });
    }

    const result = await AdminEventModel.deleteEvent(id);

    if (!result.canDelete) {
      return res.status(400).json({
        canDelete: false,
        message: result.message || "Cannot delete this event because it has bookings or participants signed up."
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





// for auto delete event without participants signed up
async function autoDeleteEvent(req, res) {
  try {
    const { eventID } = req.params;
    const id = parseInt(eventID, 10);

    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid eventID" });
    }

    // Check if event exists first
    const eventCheck = await AdminEventModel.getEventById(id);
    if (!eventCheck) {
      return res.status(404).json({ message: "Event not found" });
    }

    const result = await AdminEventModel.autoDeleteEvent(id);

    if (!result.canDelete) {
      return res.status(400).json({
        canDelete: false,
        message: result.message || "Cannot delete this event because it has bookings or participants signed up."
      });
    }

    return res.status(200).json({
      canDelete: true,
      message: "Event auto-deleted successfully"
    });

  } catch (error) {
    console.error("Error in autoDeleteEvent controller:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
}



module.exports = { getAllEvents,createEvent,assignEventToOrgan,getEventLocation,deleteEvent,autoDeleteEvent

 };