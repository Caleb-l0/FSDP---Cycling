const token = localStorage.getItem('token');
if (!token) {
  window.location.href = '../../index.html';
}

const eventList = document.getElementById('eventList');
const API_BASE = 'https://fsdp-cycling-ltey.onrender.com';

let organizationId = null;

// Get organization ID for the current user
async function getOrganizationId() {
  try {
    const response = await fetch(`${API_BASE}/user/organization-id`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get organization ID');
    }

    const data = await response.json();
    return data.organizationId;
  } catch (error) {
    console.error('Error getting organization ID:', error);
    return null;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  organizationId = await getOrganizationId();
  if (!organizationId) {
    eventList.innerHTML = '<div class="event-message event-message--error">You are not associated with any organization. Please contact support.</div>';
    return;
  }
  loadEvents();
});

async function loadEvents() {
  setStatusMessage('loading', 'Loading available events...');

  try {
    const response = await fetch(`${API_BASE}/organization/events/available`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch events (${response.status})`);
    }

    const events = await response.json();

    if (!Array.isArray(events) || events.length === 0) {
      setStatusMessage('empty', 'No events available for booking at the moment. Please check back later!');
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

    const title = event.eventname || event.EventName || 'Untitled Event';
    const date = formatDate(event.eventdate || event.EventDate);
    const description = event.description || event.Description || 'No description available.';
    const location = event.location || event.Location || 'Location TBD';
    const required = event.requiredvolunteers || event.RequiredVolunteers || 0;
    const maxParticipants = event.maximumparticipant || event.MaximumParticipant || 0;

    card.innerHTML = `
      <div class="event-details">
        <h3>${title}</h3>
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>Location:</strong> ${location}</p>
        <p><strong>Required Volunteers:</strong> ${required}</p>
        ${maxParticipants > 0 ? `<p><strong>Max Participants:</strong> ${maxParticipants}</p>` : ''}
        <p>${description}</p>
      </div>
    `;

    const button = document.createElement('button');
    button.classList.add('signup-btn');
    button.type = 'button';
    button.textContent = 'Request to Book';
    button.addEventListener('click', () => openBookingModal(event));

    card.querySelector('.event-details').appendChild(button);
    eventList.appendChild(card);
  });
}

function openBookingModal(event) {
  const modal = document.createElement('div');
  modal.className = 'booking-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close-modal">&times;</span>
      <h2>Request to Book Event</h2>
      <form id="bookingForm">
        <div class="form-group">
          <label for="participants">Number of Participants *</label>
          <input type="number" id="participants" name="participants" min="1" required>
        </div>
        <div class="form-group">
          <label for="sessionHeadName">Session Head Name *</label>
          <input type="text" id="sessionHeadName" name="sessionHeadName" required>
        </div>
        <div class="form-group">
          <label for="sessionHeadContact">Session Head Contact Number *</label>
          <input type="tel" id="sessionHeadContact" name="sessionHeadContact" required>
        </div>
        <div class="form-group">
          <label for="sessionHeadEmail">Session Head Email *</label>
          <input type="email" id="sessionHeadEmail" name="sessionHeadEmail" required>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" id="postToCommunity" checked>
            Post to community board when approved
          </label>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn-submit">Submit Request</button>
          <button type="button" class="btn-cancel" onclick="this.closest('.booking-modal').remove()">Cancel</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
  modal.querySelector('#bookingForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await submitBookingRequest(event, modal);
  });
}

async function submitBookingRequest(event, modal) {
  try {
    const form = document.getElementById('bookingForm');
    const participants = parseInt(form.participants.value);
    const sessionHeadName = form.sessionHeadName.value.trim();
    const sessionHeadContact = form.sessionHeadContact.value.trim();
    const sessionHeadEmail = form.sessionHeadEmail.value.trim();
    const postToCommunity = form.postToCommunity.checked;

    if (!participants || participants < 1) {
      alert('Please enter a valid number of participants');
      return;
    }

    const response = await fetch(`${API_BASE}/organization/events/request`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        eventId: event.eventid || event.EventID,
        participants: participants,
        sessionHeadName: sessionHeadName,
        sessionHeadContact: sessionHeadContact,
        sessionHeadEmail: sessionHeadEmail,
        postToCommunity: postToCommunity
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to submit booking request');
    }

    const data = await response.json();
    alert('✅ Booking request submitted successfully! You will be notified when the admin reviews it.');
    modal.remove();
    loadEvents(); // Refresh the list

  } catch (error) {
    console.error('Error submitting booking request:', error);
    alert('❌ Error: ' + error.message);
  }
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
