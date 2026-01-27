const express = require("express");
const router = express.Router();
const controller = require("../Controllers/EventBookingController");
const { authenticate } = require("../Accounts/login/authenticate");

// Get available events (for institutions to view)
router.get("/available", authenticate, controller.getAvailableEvents);

// Create booking request (institution requests to book)
router.post("/booking/request", authenticate, controller.createBookingRequest);

// Get all booking requests (for admin)
router.get("/requests", authenticate, controller.getAllBookingRequests);

// Get booking request by ID
router.get("/requests/:bookingId", authenticate, controller.getBookingRequestById);

// Approve booking request (admin)
router.put("/requests/:bookingId/approve", authenticate, controller.approveBookingRequest);

// Reject booking request (admin)
router.put("/requests/:bookingId/reject", authenticate, controller.rejectBookingRequest);

// Get organization's bookings (can use organizationId param or auto-detect from user)
router.get("/organization/:organizationId", authenticate, controller.getOrganizationBookings);
router.get("/my-bookings", authenticate, controller.getOrganizationBookings);

// Assign event head to approved booking
router.put("/bookings/:bookingId/assign-head", authenticate, controller.assignEventHead);

// Legacy route (keep for backward compatibility)
router.post("/:eventId/book", authenticate, controller.createBookingRequest);

module.exports = router;
