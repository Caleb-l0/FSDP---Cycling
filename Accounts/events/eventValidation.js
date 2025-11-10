function validateEventRequest(req, res, next) {
  const { eventName, eventDate, description, requiredVolunteers } = req.body;

  if (!eventName || !eventDate || !description || !requiredVolunteers) {
    return res.status(400).json({ message: "Please fill in all required fields." });
  }

  // Ensure valid date
  const today = new Date().toISOString().split("T")[0];
  if (eventDate < today) {
    return res.status(400).json({ message: "Event date cannot be in the past." });
  }

  next();
}

module.exports = { validateEventRequest };
