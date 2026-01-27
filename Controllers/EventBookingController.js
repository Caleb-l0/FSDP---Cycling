const EventBookingModel = require("../Models/EventBookingModel");
const CommunityModel = require("../Models/Volunteer_Community_Model");

const NotificationModel = require("../Models/notification_model");

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
    
    // Get organization ID from userorganizations table if not provided
    let organizationId = req.body.organizationId;
    if (!organizationId) {
      const pool = require("../Postgres_config");
      const orgResult = await pool.query(
        `SELECT organizationid FROM userorganizations WHERE userid = $1 LIMIT 1`,
        [req.user.id]
      );
      if (orgResult.rows.length === 0) {
        return res.status(400).json({ message: "User is not associated with any organization" });
      }
      organizationId = orgResult.rows[0].organizationid;
    }

    if (!eventId || !participants) {
      return res.status(400).json({ message: "eventId and participants are required" });
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

    // Get event details for notifications and community post
    const event = await EventBookingModel.getUpcomingEvent(booking.eventid);
    
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Get organization name for email
    const pool = require("../Postgres_config");
    let organizationName = "Organization";
    try {
      const orgResult = await pool.query(
        `SELECT orgname FROM organizations WHERE organizationid = $1`,
        [booking.organizationid]
      );
      if (orgResult.rows.length > 0) {
        organizationName = orgResult.rows[0].orgname;
      }
    } catch (orgError) {
      console.warn("Could not fetch organization name:", orgError);
    }

    // Send email notification to all volunteers
    try {
      await EventBookingModel.sendEventNotificationToVolunteers(event, {
        organizationname: organizationName,
        ...booking
      });
    } catch (emailError) {
      console.warn("Failed to send email notifications to volunteers:", emailError);
      // Don't fail the approval if email sending fails
    }

    // Optionally post to community board
    if (postToCommunity !== false) { // Default to true
      try {
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
      } catch (communityError) {
        console.error("Error posting to community board:", communityError);
        // Don't fail the approval if community post fails
      }
    }

    res.status(200).json({
      message: "Booking request approved successfully. Event posted and volunteers notified.",
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
    // Try to get organizationId from user's organization
    let organizationId = req.params.organizationId;
    
    if (!organizationId) {
      // Get from userorganizations table
      const pool = require("../Postgres_config");
      const orgResult = await pool.query(
        `SELECT organizationid FROM userorganizations WHERE userid = $1 LIMIT 1`,
        [req.user.id]
      );
      if (orgResult.rows.length === 0) {
        return res.status(400).json({ message: "User is not associated with any organization" });
      }
      organizationId = orgResult.rows[0].organizationid;
    }

    const bookings = await EventBookingModel.getOrganizationBookings(organizationId);
    res.status(200).json(bookings);
  } catch (error) {
    console.error("getOrganizationBookings error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
}

/* ------------------------------
   8. Assign Event Head (for approved bookings)
------------------------------ */
async function assignEventHead(req, res) {
  try {
    const { bookingId } = req.params;
    const { eventHeadName, eventHeadContact, eventHeadEmail, eventHeadProfile } = req.body;

    if (!eventHeadName || !eventHeadContact || !eventHeadEmail) {
      return res.status(400).json({ message: "Event head name, contact, and email are required" });
    }

    // Verify that the booking belongs to the user's organization
    const pool = require("../Postgres_config");
    const orgResult = await pool.query(
      `SELECT organizationid FROM userorganizations WHERE userid = $1 LIMIT 1`,
      [req.user.id]
    );

    if (orgResult.rows.length === 0) {
      return res.status(400).json({ message: "User is not associated with any organization" });
    }

    const organizationId = orgResult.rows[0].organizationid;

    // Check if booking belongs to this organization
    const bookingCheck = await EventBookingModel.getBookingRequestById(bookingId);
    if (!bookingCheck) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (bookingCheck.organizationid !== organizationId) {
      return res.status(403).json({ message: "You do not have permission to assign event head for this booking" });
    }

    if (bookingCheck.status !== 'Approved') {
      return res.status(400).json({ message: "Event head can only be assigned to approved bookings" });
    }

    const updatedBooking = await EventBookingModel.assignEventHead(bookingId, {
      eventHeadName,
      eventHeadContact,
      eventHeadEmail,
      eventHeadProfile
    });

    res.status(200).json({
      message: "Event head assigned successfully",
      booking: updatedBooking
    });

    // Notify + email ALL volunteers (background)
    setImmediate(async () => {
      try {
        const event = await EventBookingModel.getUpcomingEvent(updatedBooking.eventid);
        const eventName = event?.eventname || 'Event';

        try {
          const eventHeadResult = await pool.query(
            `SELECT id FROM users WHERE email = $1 LIMIT 1`,
            [eventHeadEmail]
          );
          const eventHeadUserId = eventHeadResult.rows[0]?.id;

          if (eventHeadUserId) {
            await NotificationModel.createNotificationsForUsers({
              userIds: [eventHeadUserId],
              type: 'ASSIGNED_AS_EVENT_HEAD',
              title: 'You have been assigned as Event Head',
              message: `You have been assigned as the Event Head for "${eventName}".`,
              payload: {
                eventId: updatedBooking.eventid,
                bookingId: updatedBooking.bookingid,
                eventName,
                eventHeadName,
                eventHeadContact,
                eventHeadEmail
              }
            });
          }
        } catch (e) {
          console.error('[assignEventHead] Failed to notify assigned event head:', e);
        }

        const volunteers = await EventBookingModel.getAllVolunteerEmails();
        const userIds = (volunteers || []).map(v => v.id).filter(Boolean);

        if (userIds.length > 0) {
          await NotificationModel.createNotificationsForUsers({
            userIds,
            type: 'EVENT_HEAD_ASSIGNED',
            title: 'Event head assigned',
            message: `Event head assigned for ${eventName}: ${eventHeadName}.`,
            payload: {
              eventId: updatedBooking.eventid,
              bookingId: updatedBooking.bookingid,
              eventName,
              eventHeadName,
              eventHeadContact,
              eventHeadEmail
            }
          });
        }

        await EventBookingModel.sendEventHeadAssignedToVolunteers(event, {
          ...updatedBooking,
          session_head_name: eventHeadName,
          session_head_contact: eventHeadContact,
          session_head_email: eventHeadEmail,
          session_head_profile: eventHeadProfile
        });
      } catch (e) {
        console.error('[assignEventHead] Failed to notify/email volunteers:', e);
      }
    });

  } catch (error) {
    console.error("assignEventHead error:", error);
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
  getOrganizationBookings,
  assignEventHead
};
