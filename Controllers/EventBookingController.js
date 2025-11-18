const bookingModel = require("./Models/EventBookingModel");

exports.bookEvent = async (req, res) => {
    const { eventId } = req.params;
    const { organizationId, participants } = req.body;

    if (!organizationId || !participants) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    try {
        // 1. Check event exists
        const event = await bookingModel.getUpcomingEvent(eventId);
        if (!event) {
            return res.status(404).json({ message: "Event not found or not upcoming" });
        }

        // 2. Insert booking
        await bookingModel.createBooking(eventId, organizationId, participants);

        // 3. Update PeopleSignUp
        await bookingModel.updatePeopleSignUp(eventId, participants);

        // 4. Calculate volunteers
        const volunteersNeeded = Math.ceil(participants / 5);

        await bookingModel.updateVolunteers(eventId, volunteersNeeded);

        res.status(201).json({
            message: "Booking successful",
            participants,
            volunteersAdded: volunteersNeeded
        });

    } catch (err) {
        console.error("Booking error:", err);
        res.status(500).json({ message: "Server error" });
    }
};
