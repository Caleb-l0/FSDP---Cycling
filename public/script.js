const eventList = document.getElementById('eventList');
const EVENTS_ENDPOINT = `${window.location.origin}/volunteer/events`;

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
    const location = event.Location || 'Location TBD';
    const required = event.RequiredVolunteers ? `Required Volunteers: ${event.RequiredVolunteers}` : '';

    const requiredMarkup = required ? `<p>${required}</p>` : '';

    card.innerHTML = `
      <div class="event-details">
        <h3>${title}</h3>
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>Location:</strong> ${location}</p>
        <p>${description}</p>
        ${requiredMarkup}
      </div>
    `;

    const button = document.createElement('button');
    button.classList.add('signup-btn');
    button.type = 'button';
    button.textContent = 'Sign Up';
    button.addEventListener('click', () => signUp(title));

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

function signUp(eventTitle) {
  alert(`🎉 You have successfully signed up for "${eventTitle}"! (Feature in development)`);
}

