const express = require('express');
const router = express.Router();
const eventController = require('./eventController');

// GET all events
router.get('/', eventController.getEvents);

// POST sign-up for event
router.post('/signup', eventController.signUp);

module.exports = router;

