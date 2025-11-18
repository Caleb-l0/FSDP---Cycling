const express = require("express");
const router = express.Router();
const controller = require("../Controllers/EventBookingController");

router.post("/:eventId/book", controller.bookEvent);

module.exports = router;
