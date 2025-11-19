const eventList = document.getElementById('eventList');
const SIGNED_EVENTS_ENDPOINT = `${window.location.origin}/institutions/signed-events`;

// Get token
const token = localStorage.getItem('token');

if (!token) {
  window.location.href = '../Accounts/views/login.html';
}

document.addEventListener('DOMContentLoaded', () => {
  loadSignedUpEvents();
});

async function loadSignedUpEvents() {
  setStatusMessage('loading', 'Loading signed up events...');

  try {
    const response = await fetch(SIGNED_EVENTS_ENDPOINT, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        alert('Login expired, please login again');
        window.location.href = '../Accounts/views/login.html';
        return;
      }
      throw new Error(`Failed to fetch events (${response.status})`);
    }

    const events = await response.json();

    if (!Array.isArray(events) || events.length === 0) {
      setStatusMessage('empty', 'No events found for your institution.');
      return;
    }

    renderEvents(events);

  } catch (error) {
    console.error('Error loading signed up events:', error);
    setStatusMessage('error', 'Failed to load events. Please check your network or try again later.');
  }
}

function renderEvents(events) {
  eventList.innerHTML = '';

  events.forEach(event => {
    const card = document.createElement('div');
    card.classList.add('event-card', 'signed-event-card');

    const title = event.EventName || 'Untitled Event';
    const date = formatDate(event.EventDate);
    const description = event.Description || 'No description available.';
    const location = event.EventLocation || 'Location TBD';
    const required = event.RequiredVolunteers ? `Required Volunteers: ${event.RequiredVolunteers}` : '';
    const eventStatus = event.Status || 'Upcoming';

    const requiredMarkup = required ? `<p>${required}</p>` : '';
    const statusBadge = getStatusBadge(eventStatus);

    card.innerHTML = `
      <div class="event-details">
        ${statusBadge}
        <h3>${title}</h3>
        <p><strong>Event Date:</strong> ${date}</p>
        <p><strong>Location:</strong> ${location}</p>
        <p>${description}</p>
        ${requiredMarkup}
      </div>
    `;

    eventList.appendChild(card);
  });
}

function getStatusBadge(eventStatus) {
  let badgeClass = 'status-badge';
  let badgeText = '';

  if (eventStatus === 'Completed') {
    badgeClass += ' status-badge--completed';
    badgeText = 'Completed';
  } else if (eventStatus === 'Ongoing') {
    badgeClass += ' status-badge--ongoing';
    badgeText = 'Ongoing';
  } else if (eventStatus === 'Cancelled') {
    badgeClass += ' status-badge--cancelled';
    badgeText = 'Cancelled';
  } else {
    badgeClass += ' status-badge--upcoming';
    badgeText = 'Upcoming';
  }

  return `<span class="${badgeClass}">${badgeText}</span>`;
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
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
