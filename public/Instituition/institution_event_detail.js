const token = localStorage.getItem('token');
const role = localStorage.getItem('role');

if (!token) {
  window.location.href = '../../index.html';
}

const API_BASE = 'https://fsdp-cycling-ltey.onrender.com';
let currentEvent = null;
let currentApplication = null;
let organizationId = null;

function handleAuthFailure(message = 'Invalid token. Please log in again.') {
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
  } catch {
    // ignore
  }
  alert(message);
  window.location.href = '../../index.html';
}

// Get data from localStorage
const eventData = localStorage.getItem('currentEvent');
const applicationData = localStorage.getItem('currentApplication');

// Get organization ID
async function getOrganizationId() {
  try {
    const response = await fetch(`${API_BASE}/organisation/user/organization-id`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 401 || response.status === 403) {
      handleAuthFailure('Invalid token. Please log in again.');
      return null;
    }

    if (!response.ok) {
      let bodyText = '';
      try {
        bodyText = await response.text();
      } catch {
        // ignore
      }
      console.error('Failed to get organization ID', {
        status: response.status,
        statusText: response.statusText,
        body: bodyText
      });
      return null;
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

    if (response.status === 401 || response.status === 403) {
      handleAuthFailure('Invalid token. Please log in again.');
      return;
    }

    if (!response.ok) {
      let bodyText = '';
      try {
        bodyText = await response.text();
      } catch {
        // ignore
      }
      throw new Error(`Failed to fetch event details (status ${response.status}): ${bodyText}`);
    }

    currentEvent = await response.json();
    displayEventDetails();
  } catch (error) {
    console.error('Error fetching event details:', error);
    showError('Failed to load event details. Please try again.');
  }
}

// Show error message
function showError(message) {
  const nameEl = document.getElementById('event-name');
  if (nameEl) nameEl.textContent = 'Error Loading Event';
  
  const actionBtns = document.getElementById('action-buttons');
  if (actionBtns) {
    actionBtns.innerHTML = `
      <div class="status-message status-rejected-msg">
        <i class="fas fa-exclamation-circle"></i>
        ${message}
      </div>
      <button class="btn-action btn-secondary" onclick="window.history.back()">
        <i class="fas fa-arrow-left"></i> Go Back
      </button>
    `;
  }
}

// Display event details
function displayEventDetails() {
  if (!currentEvent) return;

  // Event name
  const eventName = currentEvent.eventname || currentEvent.EventName || 'Unknown Event';
  const nameEl = document.getElementById('event-name');
  if (nameEl) nameEl.textContent = eventName;

  // Status badge
  const status = currentApplication?.status || currentApplication?.Status || 
                 currentEvent.status || currentEvent.Status || 'Available';
  const statusBadge = document.getElementById('event-status-badge');
  if (statusBadge) {
    statusBadge.textContent = status;
    statusBadge.className = 'event-status-badge';
    if (status.toLowerCase() === 'approved') {
      statusBadge.classList.add('status-approved');
    } else if (status.toLowerCase() === 'pending') {
      statusBadge.classList.add('status-pending');
    } else if (status.toLowerCase() === 'rejected') {
      statusBadge.classList.add('status-rejected');
    } else {
      statusBadge.classList.add('status-available');
    }
  }

  // Event Image
  const eventImage = currentEvent.eventimage || currentEvent.EventImage || currentEvent.image || currentEvent.Image;
  const imageContainer = document.getElementById('event-image-container');
  if (imageContainer && eventImage) {
    imageContainer.innerHTML = `<img src="${eventImage}" alt="${eventName}" onerror="this.parentElement.innerHTML='<div class=\\'event-image-placeholder\\'><i class=\\'fas fa-image\\'></i><p>Image not available</p></div>'">`;
  }

  // Participant Stats
  const participantCurrent = currentEvent.participantsignup || currentEvent.ParticipantSignUp || currentEvent.peoplesignup || currentEvent.PeopleSignUp || 0;
  const participantMax = currentEvent.maxparticipants || currentEvent.MaxParticipants || currentEvent.participantlimit || currentEvent.ParticipantLimit || 0;
  const participantCurrentEl = document.getElementById('participant-current');
  const participantMaxEl = document.getElementById('participant-max');
  if (participantCurrentEl) participantCurrentEl.textContent = participantCurrent;
  if (participantMaxEl) participantMaxEl.textContent = participantMax || '∞';

  // Volunteer Stats
  const volunteerCurrent = currentEvent.volunteersignup || currentEvent.VolunteerSignUp || 0;
  const volunteerMax = currentEvent.requiredvolunteers || currentEvent.RequiredVolunteers || 0;
  const volunteerCurrentEl = document.getElementById('volunteer-current');
  const volunteerMaxEl = document.getElementById('volunteer-max');
  if (volunteerCurrentEl) volunteerCurrentEl.textContent = volunteerCurrent;
  if (volunteerMaxEl) volunteerMaxEl.textContent = volunteerMax || '∞';

  // Event date
  const eventDate = currentEvent.eventdate || currentEvent.EventDate;
  const dateEl = document.getElementById('event-date');
  if (dateEl) {
    dateEl.textContent = eventDate ? new Date(eventDate).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : 'Date not set';
  }

  // Location
  const location = currentEvent.location || currentEvent.Location || 'Location TBD';
  const locEl = document.getElementById('event-location');
  if (locEl) locEl.textContent = location;

  // Description
  const description = currentEvent.description || currentEvent.Description || 'No description available.';
  const descEl = document.getElementById('event-description');
  if (descEl) descEl.textContent = description;

  // Event Head Section
  displayEventHeadSection();

  // Action Buttons
  setupActionButtons();
}

// Display Event Head Section
function displayEventHeadSection() {
  const section = document.getElementById('event-head-section');
  const content = document.getElementById('event-head-content');
  if (!section || !content) return;

  // Get event head info from application or event
  const headName = currentApplication?.session_head_name || currentApplication?.SessionHeadName ||
                   currentEvent?.session_head_name || currentEvent?.SessionHeadName;
  const headContact = currentApplication?.session_head_contact || currentApplication?.SessionHeadContact ||
                      currentEvent?.session_head_contact || currentEvent?.SessionHeadContact;
  const headEmail = currentApplication?.session_head_email || currentApplication?.SessionHeadEmail ||
                    currentEvent?.session_head_email || currentEvent?.SessionHeadEmail;
  const headProfile = currentApplication?.session_head_profile || currentApplication?.SessionHeadProfile ||
                      currentEvent?.session_head_profile || currentEvent?.SessionHeadProfile;

  const appStatus = currentApplication?.status || currentApplication?.Status;
  const eventOrgId = currentEvent?.organizationid || currentEvent?.OrganizationID;
  const appOrgId = currentApplication?.organizationid || currentApplication?.OrganizationID;
  const isMyOrg = organizationId && ((eventOrgId && (Number(organizationId) === Number(eventOrgId))) || (appOrgId && (Number(organizationId) === Number(appOrgId))));
  const isApproved = appStatus?.toLowerCase() === 'approved';

  // Show section if event is assigned to user's org
  if (isMyOrg || headName) {
    section.style.display = 'block';

    if (headName) {
      // Show event head details
      const initials = headName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
      content.innerHTML = `
        <div class="event-head-card">
          <div class="event-head-avatar">${initials}</div>
          <div class="event-head-info">
            <div class="event-head-name">${headName}</div>
            <div class="event-head-contact">
              ${headEmail ? `
                <div class="event-head-contact-item">
                  <i class="fas fa-envelope"></i>
                  <a href="mailto:${headEmail}">${headEmail}</a>
                </div>
              ` : ''}
              ${headContact ? `
                <div class="event-head-contact-item">
                  <i class="fas fa-phone"></i>
                  <a href="tel:${headContact}">${headContact}</a>
                </div>
              ` : ''}
              ${headProfile ? `
                <div class="event-head-contact-item">
                  <i class="fas fa-user"></i>
                  <span>${headProfile}</span>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    } else if (isApproved && isMyOrg) {
      // Show assign prompt
      content.innerHTML = `
        <div class="no-event-head">
          <i class="fas fa-user-plus"></i>
          <p>No Event Head has been assigned yet.</p>
          <button class="btn-action btn-primary" onclick="openAssignEventHeadModal()">
            <i class="fas fa-user-plus"></i> Assign Event Head
          </button>
        </div>
      `;
    }
  }
}

// Setup action buttons based on status
function setupActionButtons() {
  const btnGroup = document.getElementById('action-buttons');
  if (!btnGroup) return;
  btnGroup.innerHTML = '';

  const appStatus = currentApplication?.status || currentApplication?.Status;
  const eventOrgId = currentEvent?.organizationid || currentEvent?.OrganizationID;
  const appOrgId = currentApplication?.organizationid || currentApplication?.OrganizationID;
  const isMyOrg = organizationId && ((eventOrgId && (Number(organizationId) === Number(eventOrgId))) || (appOrgId && (Number(organizationId) === Number(appOrgId))));

  if (appStatus) {
    // We have an application
    if (appStatus.toLowerCase() === 'approved') {
      // Check if event head is assigned
      const headName = currentApplication?.session_head_name || currentApplication?.SessionHeadName;
      if (!headName && isMyOrg) {
        const assignBtn = document.createElement('button');
        assignBtn.className = 'btn-action btn-primary';
        assignBtn.innerHTML = '<i class="fas fa-user-plus"></i> Assign Event Head';
        assignBtn.addEventListener('click', openAssignEventHeadModal);
        btnGroup.appendChild(assignBtn);
      } else {
        const successMsg = document.createElement('div');
        successMsg.className = 'status-message status-success-msg';
        successMsg.innerHTML = '<i class="fas fa-check-circle"></i> This event is confirmed and ready!';
        btnGroup.appendChild(successMsg);
      }
    } else if (appStatus.toLowerCase() === 'pending') {
      const pendingMsg = document.createElement('div');
      pendingMsg.className = 'status-message status-pending-msg';
      pendingMsg.innerHTML = '<i class="fas fa-clock"></i> Your application is pending approval from admin.';
      btnGroup.appendChild(pendingMsg);
    } else if (appStatus.toLowerCase() === 'rejected') {
      const rejectedMsg = document.createElement('div');
      rejectedMsg.className = 'status-message status-rejected-msg';
      rejectedMsg.innerHTML = '<i class="fas fa-times-circle"></i> Your application was rejected.';
      btnGroup.appendChild(rejectedMsg);
    }
  } else {
    // No application - show request button if event is available
    if (eventOrgId === null || eventOrgId === undefined) {
      const requestBtn = document.createElement('button');
      requestBtn.className = 'btn-action btn-orange';
      requestBtn.innerHTML = '<i class="fas fa-calendar-plus"></i> Request to Book This Event';
      requestBtn.addEventListener('click', () => requestToBook(requestBtn));
      btnGroup.appendChild(requestBtn);
    }
  }

  // Always show back button
  const backBtn = document.createElement('button');
  backBtn.className = 'btn-action btn-secondary';
  backBtn.innerHTML = '<i class="fas fa-arrow-left"></i> Back to Events';
  backBtn.addEventListener('click', () => window.history.back());
  btnGroup.appendChild(backBtn);
}

// Request to book event
async function requestToBook(btn) {
  try {
    const eventId = currentEvent.eventid || currentEvent.EventID;
    if (!eventId) {
      alert('Event ID not found');
      return;
    }

    if (!organizationId) {
      alert('Organization not found. Please make sure you are logged in with an organization account.');
      return;
    }

    // Disable button and show loading
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending Request...';

    const response = await fetch(`${API_BASE}/organization/events/request`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        eventId: eventId,
        organizationId: organizationId
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to send booking request');
    }

    showSuccessAnimation({
      title: 'Request Sent!',
      message: 'Your booking request has been sent to the admin for approval. You can track your application on the homepage.',
      buttonText: 'Go to Homepage',
      buttonHref: './homepage_login_instituition.html'
    });

  } catch (error) {
    console.error('Error requesting to book:', error);
    alert('❌ Error: ' + error.message);
    
    // Reset button
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-calendar-plus"></i> Request to Book This Event';
  }
}

// Show success animation overlay
function showSuccessAnimation({ title, message, buttonText, buttonHref } = {}) {
  const overlay = document.getElementById('success-overlay');
  if (!overlay) return;

  const titleEl = overlay.querySelector('.success-title');
  const messageEl = overlay.querySelector('.success-message');
  const btnEl = overlay.querySelector('.success-btn');

  if (titleEl && title) titleEl.textContent = title;
  if (messageEl && message) messageEl.textContent = message;
  if (btnEl) {
    if (buttonText) {
      btnEl.innerHTML = `<i class="fas fa-check"></i> ${buttonText}`;
    }

    btnEl.onclick = () => {
      overlay.classList.remove('show');
      if (buttonHref) {
        window.location.href = buttonHref;
      }
    };
  }

  overlay.classList.add('show');
}

// Open modal to assign event head
function openAssignEventHeadModal() {
  const modal = document.createElement('div');
  modal.className = 'booking-modal';
  modal.style.display = 'flex';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 550px;">
      <span class="close-modal">&times;</span>
      <h2 style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem;">
        <i class="fas fa-user-tie" style="color: #f4a261;"></i> Assign Event Head
      </h2>
      <form id="assignEventHeadForm">
        <div class="form-group">
          <label for="eventHeadName">Full Name *</label>
          <input type="text" id="eventHeadName" name="eventHeadName" required 
                 placeholder="Enter event head's full name" style="font-size: 1.1rem; padding: 1rem;">
        </div>
        <div class="form-group">
          <label for="eventHeadEmail">Email Address *</label>
          <input type="email" id="eventHeadEmail" name="eventHeadEmail" required 
                 placeholder="Enter email address" style="font-size: 1.1rem; padding: 1rem;">
        </div>
        <div class="form-group">
          <label for="eventHeadContact">Mobile Number *</label>
          <input type="tel" id="eventHeadContact" name="eventHeadContact" required 
                 placeholder="Enter mobile number" style="font-size: 1.1rem; padding: 1rem;">
        </div>
        <div class="form-group">
          <label for="eventHeadProfile">Brief Profile (Optional)</label>
          <textarea id="eventHeadProfile" name="eventHeadProfile" rows="3" 
                    placeholder="Brief description or role of the event head..."
                    style="font-size: 1.1rem; padding: 1rem;"></textarea>
        </div>
        <div class="form-actions" style="margin-top: 2rem;">
          <button type="submit" class="btn-submit" style="font-size: 1.1rem; padding: 1rem;">
            <i class="fas fa-check"></i> Confirm Assignment
          </button>
          <button type="button" class="btn-cancel" style="font-size: 1.1rem; padding: 1rem;" 
                  onclick="this.closest('.booking-modal').remove()">Cancel</button>
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

// Assign event head API call
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

    const requestId = currentApplication?.requestid || currentApplication?.RequestID;
    if (!requestId) {
      alert('Request ID not found. Please try again.');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Assigning...';

    const response = await fetch(`${API_BASE}/organization/events/requests/${requestId}/assign-head`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        eventHeadName,
        eventHeadContact,
        eventHeadEmail,
        eventHeadProfile
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to assign event head');
    }

    modal.remove();
    showSuccessAnimation({
      title: 'Event Head Assigned',
      message: 'Event head information has been saved successfully.',
      buttonText: 'Close'
    });
    
    // Update application data
    if (currentApplication) {
      currentApplication.session_head_name = eventHeadName;
      currentApplication.session_head_contact = eventHeadContact;
      currentApplication.session_head_email = eventHeadEmail;
      currentApplication.session_head_profile = eventHeadProfile;
    }

    // Refresh display
    displayEventHeadSection();
    setupActionButtons();

  } catch (error) {
    console.error('Error assigning event head:', error);
    alert('❌ Error: ' + error.message);
    
    const submitBtn = document.querySelector('#assignEventHeadForm button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-check"></i> Confirm Assignment';
    }
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  // Get organization ID first
  organizationId = await getOrganizationId();

  // Parse stored data
  if (eventData) {
    currentEvent = JSON.parse(eventData);
  }
  
  if (applicationData) {
    currentApplication = JSON.parse(applicationData);
    // If we have an application but no event, fetch event details
    if (!currentEvent && (currentApplication.eventid || currentApplication.EventID)) {
      await fetchEventDetails(currentApplication.eventid || currentApplication.EventID);
      return;
    }
  }

  if (!currentEvent && !currentApplication) {
    showError('No event selected. Please go back and select an event.');
    return;
  }

  displayEventDetails();
});
