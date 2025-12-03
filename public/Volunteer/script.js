const eventList = document.getElementById('eventList');
const EVENTS_ENDPOINT = `https://fsdp-cycling-ltey.onrender.com/volunteer/events`;

document.addEventListener('DOMContentLoaded', () => {
  loadEvents();
});

async function loadEvents() {
  setStatusMessage('loading', 'Loading volunteer events...');

  try {
    const response = await fetch(EVENTS_ENDPOINT);

    if (!response.ok) {
      throw new Error(`Failed to fetch events (${response.status})`);
    }

    const events = await response.json();

    if (!Array.isArray(events) || events.length === 0) {
      setStatusMessage('empty', 'No events available for sign up at the moment. Please check back later!');
      return;
    }

    renderEvents(events);

  } catch (error) {
    console.error('Error loading events:', error);
    setStatusMessage('error', 'Failed to load events. Please check your network or try again later.');
  }
}

function renderEvents(events) {
  eventList.innerHTML = '';

  events.forEach(event => {
    const card = document.createElement('div');
    card.classList.add('event-card');

    const title = event.EventName || 'Untitled Event';
    const date = formatDate(event.EventDate);
    const description = event.Description || 'No description available.';
    
    const location = event.Location || 'Location TBD';   // ✅ FIXED HERE
    const required = event.RequiredVolunteers
      ? `Required Volunteers: ${event.RequiredVolunteers}`
      : '';

    card.innerHTML = `
      <div class="event-details">
        <h3>${title}</h3>
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>Location:</strong> ${location}</p>
        <p>${description}</p>
        ${required ? `<p>${required}</p>` : ''}
      </div>
    `;

    const button = document.createElement('button');
    button.classList.add('signup-btn');
    button.type = 'button';
    button.textContent = 'Sign Up';
    button.addEventListener('click', () => signUp(title, event.EventID));

    card.querySelector('.event-details').appendChild(button);

    eventList.appendChild(card);
  });
}


function setStatusMessage(type, message) {
  eventList.innerHTML = `
    <div class="event-message event-message--${type}">
      ${message}
    </div>
  `;
}

function formatDate(rawDate) {
  if (!rawDate) return 'Date TBD';

  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) return rawDate;

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

async function signUp(eventTitle, eventId) {
  const token = localStorage.getItem('token');
  
  if (!token) {
    alert('Please login first');
    window.location.href = '../../index.html';
    return;
  }

  try {
    const response = await fetch(`https://fsdp-cycling-ltey.onrender.com/events/signup`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ eventId })  
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message);
    }

    alert(`🎉 You have successfully signed up for "${eventTitle}"!`);

  } catch (error) {
    if (error.message.includes('already')) {
      alert('You already signed up for this event.');
      return;
    }
    alert('Failed to sign up.');
  }
}


