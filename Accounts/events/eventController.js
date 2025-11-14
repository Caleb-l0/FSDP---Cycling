const eventModel = require("./eventModel");

async function submitEventRequest(req, res) {
  try {
  
    const { OrganizationID, eventName, eventDate, description, requiredVolunteers, specialInvite } = req.body;

    if (!OrganizationID || !eventName || !eventDate || !description || !requiredVolunteers) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    // Create volunteer request
    const requestId = await eventModel.createEventRequest({
      OrganizationID,
      RequesterID: req.user.id,
      EventName: eventName,
      EventDate: eventDate,
      Description: description,
      RequiredVolunteers: requiredVolunteers,
      SpecialInvite: specialInvite ?? ""
    });

    // Notify admins
    await eventModel.notifyAdmins(requestId, eventName);

    res.status(201).json({ 
      message: "Request submitted and admins notified.",
      requestId 
    });

  } catch (err) {
    console.error("submitEventRequest error:", err);
    res.status(500).json({ message: "Database error." });
  }
}


module.exports = { submitEventRequest };
