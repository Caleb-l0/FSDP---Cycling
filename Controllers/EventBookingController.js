const EventBookingModel = require("../Models/EventBookingModel");
const CommunityModel = require("../Models/Volunteer_Community_Model");

/* ======================================================
   Event Booking Controller
   Purpose: Handle organization booking requests for events
   ====================================================== */

/* ------------------------------
   1. Get Available Events (for institutions)
------------------------------ */
async function getAvailableEvents(req, res) {
  try {
    const events = await EventBookingModel.getAvailableEvents();
    res.status(200).json(events);
  } catch (error) {
    console.error("getAvailableEvents error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
}

/* ------------------------------
   2. Create Booking Request (institution requests to book)
------------------------------ */
async function createBookingRequest(req, res) {
  try {
    const { eventId, participants, sessionHeadName, sessionHeadContact, sessionHeadEmail, postToCommunity } = req.body;
    const organizationId = req.user.organizationId || req.body.organizationId;

    if (!eventId || !participants || !organizationId) {
      return res.status(400).json({ message: "eventId, participants, and organizationId are required" });
    }

    // Check if event exists and is available
    const event = await EventBookingModel.getUpcomingEvent(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found or not available for booking" });
    }

    // Check if event is already booked
    if (event.organizationid !== null) {
      return res.status(400).json({ message: "Event is already booked by another organization" });
    }

    // Create booking request
    const bookingData = {
      eventId,
      organizationId,
      participants,
      sessionHeadName,
      sessionHeadContact,
      sessionHeadEmail
    };

    const booking = await EventBookingModel.createBookingRequest(bookingData);

    res.status(201).json({
      message: "Booking request submitted successfully",
      booking
    });

  } catch (error) {
    console.error("createBookingRequest error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
}

/* ------------------------------
   3. Get All Booking Requests (for admin)
------------------------------ */
async function getAllBookingRequests(req, res) {
  try {
    const requests = await EventBookingModel.getAllBookingRequests();
    res.status(200).json(requests);
  } catch (error) {
    console.error("getAllBookingRequests error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
}

/* ------------------------------
   4. Get Booking Request By ID
------------------------------ */
async function getBookingRequestById(req, res) {
  try {
    const { bookingId } = req.params;
    const booking = await EventBookingModel.getBookingRequestById(bookingId);
    
    if (!booking) {
      return res.status(404).json({ message: "Booking request not found" });
    }

    res.status(200).json(booking);
  } catch (error) {
    console.error("getBookingRequestById error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
}

/* ------------------------------
   5. Approve Booking Request (admin approves)
------------------------------ */
async function approveBookingRequest(req, res) {
  try {
    const { bookingId } = req.params;
    const { postToCommunity } = req.body; // Optional: post to community board
    const reviewedBy = req.user.id;

    const booking = await EventBookingModel.approveBookingRequest(bookingId, reviewedBy);

    if (!booking) {
      return res.status(404).json({ message: "Booking request not found" });
    }

    // Optionally post to community board
    if (postToCommunity !== false) { // Default to true
      try {
        // Get event details for the post
        const event = await EventBookingModel.getUpcomingEvent(booking.eventid);
        if (event) {
          const postContent = `🎉 New Event: ${event.eventname}\n\n` +
            `📅 Date: ${new Date(event.eventdate).toLocaleDateString()}\n` +
            `📍 Location: ${event.location || 'TBA'}\n` +
            `📝 ${event.description || ''}\n\n` +
            (booking.session_head_name ? `👤 Session Head: ${booking.session_head_name}\n` : '') +
            (booking.session_head_contact ? `📞 Contact: ${booking.session_head_contact}\n` : '') +
            (booking.session_head_email ? `📧 Email: ${booking.session_head_email}\n` : '');

          await CommunityModel.createPost({
            userid: reviewedBy, // Admin or organization user
            content: postContent,
            photourl: null,
            visibility: 'public',
            taggedinstitutionid: booking.organizationid
          });
        }
      } catch (communityError) {
        console.error("Error posting to community board:", communityError);
        // Don't fail the approval if community post fails
      }
    }

    res.status(200).json({
      message: "Booking request approved successfully",
      booking
    });

  } catch (error) {
    console.error("approveBookingRequest error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
}

/* ------------------------------
   6. Reject Booking Request (admin rejects)
------------------------------ */
async function rejectBookingRequest(req, res) {
  try {
    const { bookingId } = req.params;
    const reviewedBy = req.user.id;

    const booking = await EventBookingModel.rejectBookingRequest(bookingId, reviewedBy);

    if (!booking) {
      return res.status(404).json({ message: "Booking request not found" });
    }

    res.status(200).json({
      message: "Booking request rejected",
      booking
    });

  } catch (error) {
    console.error("rejectBookingRequest error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
}

/* ------------------------------
   7. Get Organization's Bookings
------------------------------ */
async function getOrganizationBookings(req, res) {
  try {
    const organizationId = req.user.organizationId || req.params.organizationId;
    
    if (!organizationId) {
      return res.status(400).json({ message: "organizationId is required" });
    }

    const bookings = await EventBookingModel.getOrganizationBookings(organizationId);
    res.status(200).json(bookings);
  } catch (error) {
    console.error("getOrganizationBookings error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
}

module.exports = {
  getAvailableEvents,
  createBookingRequest,
  getAllBookingRequests,
  getBookingRequestById,
  approveBookingRequest,
  rejectBookingRequest,
  getOrganizationBookings
};
