const eventModel = require('../models/eventModel');

async function getEvents(req, res) {
  try {
    const events = await eventModel.getAllEvents();
    res.json(events);
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ message: 'Failed to fetch events.' });
  }
}

async function signUp(req, res) {
  const { eventId, userId } = req.body;

  if (!eventId || !userId) {
    return res.status(400).json({ message: 'Missing eventId or userId' });
  }

  try {
    await eventModel.signUpForEvent(eventId, userId);
    res.json({ message: 'Sign-up successful!' });
  } catch (err) {
    console.error('Error signing up for event:', err);
    res.status(500).json({ message: 'Failed to sign up for event.' });
  }
}

module.exports = { getEvents, signUp };

