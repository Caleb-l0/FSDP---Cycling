const eventModel = require("./eventModel");

async function submitEventRequest(req, res) {
  try {
    const { eventName, eventDate, description, requiredVolunteers, specialInvite } = req.body;

    if (!eventName || !eventDate || !description || !requiredVolunteers) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    await eventModel.createEventRequest(eventName, eventDate, description, requiredVolunteers, specialInvite);

    res.status(201).json({ message: "Event request submitted successfully." });
  } catch (err) {
    console.error("submitEventRequest error:", err);
    res.status(500).json({ message: "Database error." });
  }
}

module.exports = { submitEventRequest };
