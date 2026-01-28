// ======================================================
// Request to Book Existing Event
// ADD THIS FUNCTION BEFORE module.exports in OrganizationRequestController.js
// ======================================================
async function requestEventBooking(req, res) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { eventId } = req.body;
    if (!eventId) {
      return res.status(400).json({ message: "Event ID is required" });
    }

    const requesterId = req.user.id;
    const organizationId = await OrganizationRequestModel.getOrganisationIDByUserID(requesterId);
    
    if (!organizationId) {
      return res.status(400).json({ message: "User is not associated with any organization" });
    }

    const result = await OrganizationRequestModel.createEventBookingRequest(organizationId, requesterId, eventId);
    
    res.status(201).json({ 
      message: "Booking request submitted successfully! Waiting for admin approval.",
      request: result
    });
  } catch (err) {
    console.error("requestEventBooking error:", err);
    res.status(400).json({ message: err.message || "Failed to submit booking request" });
  }
}

// ALSO ADD requestEventBooking to the module.exports object:
// module.exports = {
//   ... existing exports,
//   requestEventBooking  <-- ADD THIS
// };
