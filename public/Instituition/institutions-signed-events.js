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

    const title = event.EventName || event.eventname || 'Untitled Event';
    const date = formatDate(event.EventDate || event.eventdate);
    const description = event.Description || event.description || 'No description available.';
    const location = event.EventLocation || event.location || 'Location TBD';
    const requiredVol = event.RequiredVolunteers ?? event.requiredvolunteers;
    const participants = event.Participants ?? event.participants;
    const bookedAt = formatDate(event.BookedAt || event.createdat || event.SignUpDate);
    const reviewedAt = formatDate(event.ReviewedAt || event.reviewdate);
    const bookingStatus = event.BookingStatus || event.bookingstatus || 'Pending';

    const requiredMarkup = (requiredVol != null) ? `<p><strong>Required Volunteers:</strong> ${requiredVol}</p>` : '';
    const participantsMarkup = (participants != null) ? `<p><strong>Participants:</strong> ${participants}</p>` : '';
    const bookedAtMarkup = bookedAt ? `<p class="signup-info"><strong>Booked At:</strong> ${bookedAt}</p>` : '';
    const reviewedAtMarkup = reviewedAt ? `<p class="signup-info"><strong>Reviewed At:</strong> ${reviewedAt}</p>` : '';
    const statusBadge = getBookingBadge(bookingStatus);

    card.innerHTML = `
      <div class="event-details">
        ${statusBadge}
        <h3>${title}</h3>
        <p><strong>Event Date:</strong> ${date}</p>
        <p><strong>Location:</strong> ${location}</p>
        <p>${description}</p>
        ${requiredMarkup}
        ${participantsMarkup}
        ${bookedAtMarkup}
        ${reviewedAtMarkup}
      </div>
    `;

    eventList.appendChild(card);
  });
}

function getBookingBadge(status) {
  const s = String(status || '').trim().toLowerCase();
  let badgeClass = 'status-badge';
  let badgeText = status || 'Pending';

  if (s === 'approved') {
    badgeClass += ' status-badge--completed';
    badgeText = 'Approved';
  } else if (s === 'rejected') {
    badgeClass += ' status-badge--cancelled';
    badgeText = 'Rejected';
  } else if (s === 'cancelled') {
    badgeClass += ' status-badge--cancelled';
    badgeText = 'Cancelled';
  } else {
    badgeClass += ' status-badge--upcoming';
    badgeText = 'Pending';
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
