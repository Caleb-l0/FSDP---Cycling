const eventList = document.getElementById('eventList');
const SIGNED_EVENTS_ENDPOINT = `https://fsdp-cycling-ltey.onrender.com/volunteer/signed-events`;


// Get token
const token = localStorage.getItem('token');

if (!token) {
  window.location.href = '../../index.html';
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
      setStatusMessage('empty', 'You have not signed up for any events yet.');
      return;
    }

    renderEvents(events);

  } catch (error) {
    console.error('Error loading signed up events:', error);
    setStatusMessage('error', 'Failed to load signed up events. Please check your network or try again later.');
  }
}

function renderEvents(events) {
  eventList.innerHTML = '';

  events.forEach(event => {
    const card = document.createElement('div');
    card.classList.add('event-card', 'signed-event-card');

    // Support both lowercase (from database) and uppercase field names
    const title = event.eventname || event.EventName || 'Untitled Event';
    const date = formatDate(event.eventdate || event.EventDate);
    const description = event.description || event.Description || 'No description available.';
    const location = event.location || event.EventLocation || 'Location TBD';
    const required = (event.requiredvolunteers || event.RequiredVolunteers) ? `Required Volunteers: ${event.requiredvolunteers || event.RequiredVolunteers}` : '';
    const signUpDate = formatDate(event.signupdate || event.SignUpDate);
    const eventStatus = event.status || event.Status || 'Upcoming';
    const signUpStatus = event.signupstatus || event.SignUpStatus || 'Active';

    const requiredMarkup = required ? `<p>${required}</p>` : '';
    const statusBadge = getStatusBadge(eventStatus, signUpStatus);

    card.innerHTML = `
      <div class="event-details">
        ${statusBadge}
        <h3>${title}</h3>
        <p><strong>Event Date:</strong> ${date}</p>
        <p><strong>Location:</strong> ${location}</p>
        <p>${description}</p>
        ${requiredMarkup}
        <p class="signup-info"><strong>Sign Up Date:</strong> ${signUpDate}</p>
      </div>
    `;

    eventList.appendChild(card);
  });
}

function getStatusBadge(eventStatus, signUpStatus) {
  let badgeClass = 'status-badge';
  let badgeText = '';

  if (signUpStatus === 'Cancelled') {
    badgeClass += ' status-badge--cancelled';
    badgeText = 'Cancelled';
  } else if (eventStatus === 'Completed') {
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

