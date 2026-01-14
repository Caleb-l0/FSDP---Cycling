const token = localStorage.getItem('token');
if (!token) {
  window.location.href = '../../index.html';
}

const API_BASE = 'https://fsdp-cycling-ltey.onrender.com';
let currentEvent = null;
let currentApplication = null;
let organizationId = null;

// Get data from localStorage
const eventData = localStorage.getItem('currentEvent');
const applicationData = localStorage.getItem('currentApplication');

if (eventData) {
  currentEvent = JSON.parse(eventData);
} else if (applicationData) {
  currentApplication = JSON.parse(applicationData);
  // If we have an application, fetch the event details
  if (currentApplication.eventid || currentApplication.EventID) {
    fetchEventDetails(currentApplication.eventid || currentApplication.EventID);
  }
} else {
  alert('No event selected');
  window.location.href = './homepage_login_instituition.html';
}

// Get organization ID
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

// Fetch event details from API
async function fetchEventDetails(eventId) {
  try {
    const response = await fetch(`${API_BASE}/events/${eventId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch event details');
    }

    currentEvent = await response.json();
    displayEventDetails();
  } catch (error) {
    console.error('Error fetching event details:', error);
    alert('Failed to load event details');
  }
}

// Display event details
function displayEventDetails() {
  if (!currentEvent) return;

  const eventName = currentEvent.eventname || currentEvent.EventName || 'Unknown Event';
  const eventDate = currentEvent.eventdate || currentEvent.EventDate;
  const location = currentEvent.location || currentEvent.Location || 'TBD';
  const requiredVolunteers = currentEvent.requiredvolunteers || currentEvent.RequiredVolunteers || 0;
  const participants = currentEvent.peoplesignup || currentEvent.PeopleSignUp || 0;
  const description = currentEvent.description || currentEvent.Description || 'No description available.';
  const status = currentEvent.status || currentEvent.Status || 'Unknown';

  document.getElementById('req-name').textContent = eventName;
  document.getElementById('req-date').textContent = eventDate ? new Date(eventDate).toLocaleString() : '-';
  document.getElementById('req-loc').textContent = location;
  document.getElementById('req-needed').textContent = requiredVolunteers;
  document.getElementById('req-participant').textContent = participants;
  document.getElementById('req-status').textContent = status;
  document.getElementById('req-desc').textContent = description;

  // If we have application data, show session head info
  if (currentApplication) {
    const sessionHead = currentApplication.session_head_name || currentApplication.SessionHeadName;
    const sessionContact = currentApplication.session_head_contact || currentApplication.SessionHeadContact;
    const sessionEmail = currentApplication.session_head_email || currentApplication.SessionHeadEmail;
    const appStatus = currentApplication.status || currentApplication.Status;

    if (sessionHead) {
      document.getElementById('req-session-head').textContent = sessionHead;
      document.getElementById('session-head-section').style.display = 'block';
    }
    if (sessionContact) {
      document.getElementById('req-session-contact').textContent = sessionContact;
      document.getElementById('session-contact-section').style.display = 'block';
    }
    if (sessionEmail) {
      document.getElementById('req-session-email').textContent = sessionEmail;
      document.getElementById('session-email-section').style.display = 'block';
    }

    // Show action buttons based on application status
    setupActionButtons(appStatus);
  } else {
    // Show request to book button if event is available
    if (currentEvent.organizationid === null) {
      setupRequestButton();
    }
  }
}

// Setup action buttons based on application status
function setupActionButtons(status) {
  const btnGroup = document.getElementById('action-buttons');
  btnGroup.innerHTML = '';

  if (status === 'Approved') {
    // Show assign event head button
    const assignBtn = document.createElement('button');
    assignBtn.className = 'btn-action btn-create';
    assignBtn.textContent = 'Assign Event Head';
    assignBtn.addEventListener('click', openAssignEventHeadModal);
    btnGroup.appendChild(assignBtn);
  } else if (status === 'Pending') {
    const pendingMsg = document.createElement('p');
    pendingMsg.textContent = 'Your application is pending approval.';
    pendingMsg.style.color = '#f59e0b';
    btnGroup.appendChild(pendingMsg);
  } else if (status === 'Rejected') {
    const rejectedMsg = document.createElement('p');
    rejectedMsg.textContent = 'Your application was rejected.';
    rejectedMsg.style.color = '#ef4444';
    btnGroup.appendChild(rejectedMsg);
  }
}

// Setup request to book button
function setupRequestButton() {
  const btnGroup = document.getElementById('action-buttons');
  btnGroup.innerHTML = '';

  const requestBtn = document.createElement('button');
  requestBtn.className = 'btn-action btn-create';
  requestBtn.textContent = 'Request to Book';
  requestBtn.addEventListener('click', () => {
    window.location.href = `./institutions-events.html?eventId=${currentEvent.eventid || currentEvent.EventID}`;
  });
  btnGroup.appendChild(requestBtn);
}

// Open modal to assign event head
function openAssignEventHeadModal() {
  const modal = document.createElement('div');
  modal.className = 'booking-modal';
  modal.style.display = 'flex';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 500px;">
      <span class="close-modal">&times;</span>
      <h2>Assign Event Head</h2>
      <form id="assignEventHeadForm">
        <div class="form-group">
          <label for="eventHeadName">Event Head Name *</label>
          <input type="text" id="eventHeadName" name="eventHeadName" required>
        </div>
        <div class="form-group">
          <label for="eventHeadContact">Contact Number *</label>
          <input type="tel" id="eventHeadContact" name="eventHeadContact" required>
        </div>
        <div class="form-group">
          <label for="eventHeadEmail">Email *</label>
          <input type="email" id="eventHeadEmail" name="eventHeadEmail" required>
        </div>
        <div class="form-group">
          <label for="eventHeadProfile">Profile (Optional)</label>
          <textarea id="eventHeadProfile" name="eventHeadProfile" rows="4" placeholder="Brief description of the event head..."></textarea>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn-submit">Assign Event Head</button>
          <button type="button" class="btn-cancel" onclick="this.closest('.booking-modal').remove()">Cancel</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
  modal.querySelector('#assignEventHeadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await assignEventHead(modal);
  });
}

// Assign event head
async function assignEventHead(modal) {
  try {
    const form = document.getElementById('assignEventHeadForm');
    const eventHeadName = form.eventHeadName.value.trim();
    const eventHeadContact = form.eventHeadContact.value.trim();
    const eventHeadEmail = form.eventHeadEmail.value.trim();
    const eventHeadProfile = form.eventHeadProfile.value.trim();

    if (!eventHeadName || !eventHeadContact || !eventHeadEmail) {
      alert('Please fill in all required fields');
      return;
    }

    const bookingId = currentApplication.bookingid || currentApplication.BookingID;
    if (!bookingId) {
      alert('Booking ID not found');
      return;
    }

    const response = await fetch(`${API_BASE}/organization/events/bookings/${bookingId}/assign-head`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        eventHeadName: eventHeadName,
        eventHeadContact: eventHeadContact,
        eventHeadEmail: eventHeadEmail,
        eventHeadProfile: eventHeadProfile
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to assign event head');
    }

    alert('✅ Event head assigned successfully!');
    modal.remove();
    
    // Update the displayed information
    document.getElementById('req-session-head').textContent = eventHeadName;
    document.getElementById('req-session-contact').textContent = eventHeadContact;
    document.getElementById('req-session-email').textContent = eventHeadEmail;
    document.getElementById('session-head-section').style.display = 'block';
    document.getElementById('session-contact-section').style.display = 'block';
    document.getElementById('session-email-section').style.display = 'block';

    // Remove the assign button
    document.getElementById('action-buttons').innerHTML = '<p style="color: #10b981;">Event head assigned successfully!</p>';

  } catch (error) {
    console.error('Error assigning event head:', error);
    alert('❌ Error: ' + error.message);
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  organizationId = await getOrganizationId();
  if (currentEvent) {
    displayEventDetails();
  }
});

