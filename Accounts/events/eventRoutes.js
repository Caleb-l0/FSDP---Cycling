const express = require('express');
const router = express.Router();
const { submitEventRequest } = require('./eventController');
const { authenticate } = require('../login/authenticate');

// POST: Institution submits a volunteer request
router.post('/volunteerRequests', authenticate, submitEventRequest);

module.exports = router;
