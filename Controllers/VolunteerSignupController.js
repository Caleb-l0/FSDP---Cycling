const VolunteerSignupModel = require("../Models/VolunteerSignupModel");


// ======================================================
// Volunteer Signup Controller
// Purpose: Handle volunteer sign ups for events
// Table: eventsignups (volunteers sign up for events)
// ======================================================


// ======================================================
// 1. Sign Up For Event
// ======================================================
async function signUp(req, res) {
  try {
    const { eventId, userId } = req.body;

    if (!eventId || !userId) {
      return res.status(400).json({ message: "eventId and userId are required" });
    }

    await VolunteerSignupModel.signUpForEvent(userId, eventId);
    res.status(200).json({ message: "Successfully signed up for event" });
  } catch (error) {
    if (error.message === "User already signed up") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Server Error", error: error.message });
  }
}


// ======================================================
// 2. Cancel Signup
// ======================================================
async function cancelSignup(req, res) {
  try {
    const { eventId, userId } = req.body;

    if (!eventId || !userId) {
      return res.status(400).json({ message: "eventId and userId are required" });
    }

    const result = await VolunteerSignupModel.cancelSignup(userId, eventId);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Signup not found or already cancelled" });
    }

    res.status(200).json({ message: "Successfully cancelled signup" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
}


// ======================================================
// 3. Check If User Already Signed Up
// ======================================================
async function checkSignupStatus(req, res) {
  try {
    const { eventId, userId } = req.query;

    if (!eventId || !userId) {
      return res.status(400).json({ message: "eventId and userId are required" });
    }

    const isSignedUp = await VolunteerSignupModel.isSignedUp(userId, eventId);
    res.status(200).json({ isSignedUp });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
}


// ======================================================
// 4. Get All Signed-Up Events For A User
// ======================================================
async function getSignedUpEvents(req, res) {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const events = await VolunteerSignupModel.getSignedUpEvents(userId);
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
}


// ======================================================
module.exports = {
  signUp,
  cancelSignup,
  checkSignupStatus,
  getSignedUpEvents
};

