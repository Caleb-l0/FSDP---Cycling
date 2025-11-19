const eventModel = require('./eventModel');

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

async function getSignedUpEvents(req, res) {
  try {
    // Get userId from JWT token (set by authenticate middleware)
    const userId = req.user?.id;
    
    if (!userId) {
      console.error('No user ID found in request. req.user:', req.user);
      return res.status(400).json({ message: 'User ID is required. Please login again.' });
    }

    console.log('Fetching signed up events for user ID:', userId);
    const events = await eventModel.getSignedUpEvents(userId);
    console.log('Found events:', events.length);
    res.json(events);
  } catch (err) {
    console.error('Error fetching signed up events:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ 
      message: 'Failed to fetch signed up events.',
      error: err.message 
    });
  }
}

module.exports = { getEvents, signUp, getSignedUpEvents };

