const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const AdminEventModel = require("../Models/Admin_event_Model");



async function getAllEvents(req, res) {
    try {
        const events = await AdminEventModel.getAllEvents();
        res.status(200).json(events);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
}





module.exports = { getAllEvents };