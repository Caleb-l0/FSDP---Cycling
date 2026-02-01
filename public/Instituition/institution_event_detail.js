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

function launchConfetti(container) {
  if (!container) return;
  container.innerHTML = '';
  const colors = ['#f4a261', '#e76f51', '#f59e0b', '#0f172a', '#64748b'];
  const pieces = 28;
  for (let i = 0; i < pieces; i += 1) {
    const el = document.createElement('i');
    const left = Math.random() * 100;
    const delay = Math.random() * 120;
    const duration = 700 + Math.random() * 600;
    const rotate = Math.floor(Math.random() * 360);
    const w = 8 + Math.random() * 8;
    const h = 10 + Math.random() * 12;
    el.style.left = `${left}%`;
    el.style.background = colors[i % colors.length];
    el.style.width = `${w}px`;
    el.style.height = `${h}px`;
    el.style.transform = `translateY(-10px) rotate(${rotate}deg)`;
    el.style.animationDelay = `${delay}ms`;
    el.style.animationDuration = `${duration}ms`;
    container.appendChild(el);
  }
}

function showCongrats({ title = 'Success!', message = '', autoCloseMs = 1600 } = {}) {
  const wrap = document.getElementById('hvCongrats');
  if (!wrap) return;
  const titleEl = wrap.querySelector('#hvCongratsTitle');
  const msgEl = wrap.querySelector('#hvCongratsMsg');
  if (titleEl) titleEl.textContent = title;
  if (msgEl) msgEl.textContent = message;
  launchConfetti(wrap.querySelector('.hv-confetti'));
  wrap.classList.add('is-open');

  window.clearTimeout(wrap._autoCloseTimer);
  if (Number.isFinite(autoCloseMs) && autoCloseMs > 0) {
    wrap._autoCloseTimer = window.setTimeout(() => {
      wrap.classList.remove('is-open');
      if (typeof wrap._onCloseOnce === 'function') {
        const cb = wrap._onCloseOnce;
        wrap._onCloseOnce = null;
        cb();
      }
    }, autoCloseMs);
  }
}

function setupCongratsOverlay() {
  const wrap = document.getElementById('hvCongrats');
  if (!wrap || wrap._wired) return;
  wrap._wired = true;

  const close = () => {
    wrap.classList.remove('is-open');
    if (typeof wrap._onCloseOnce === 'function') {
      const cb = wrap._onCloseOnce;
      wrap._onCloseOnce = null;
      cb();
    }
  };
  wrap.addEventListener('click', (e) => {
    if (e.target?.dataset?.close === 'true') close();
  });
  const ok = wrap.querySelector('#hvCongratsOk');
  if (ok) ok.addEventListener('click', close);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && wrap.classList.contains('is-open')) close();
  });
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

/* Reset dynamic page content to prevent event bleed */
function resetEventDetailPage() {
  document.getElementById('event-name')?.textContent = '';
  document.getElementById('event-status-badge')?.textContent = '';
  document.getElementById('event-date')?.textContent = '-';
  document.getElementById('event-location')?.textContent = '-';
  document.getElementById('event-description')?.textContent = 'No description available.';

  document.getElementById('participant-current')?.textContent = '0';
  document.getElementById('participant-max')?.textContent = '0';
  document.getElementById('volunteer-current')?.textContent = '0';
  document.getElementById('volunteer-max')?.textContent = '0';

  const imageContainer = document.getElementById('event-image-container');
  if (imageContainer) {
    imageContainer.innerHTML = `
      <div class="event-image-placeholder">
        <i class="fas fa-image"></i>
        <p>No image available</p>
      </div>
    `;
  }

  const headContent = document.getElementById('event-head-content');
  if (headContent) headContent.innerHTML = '';
  const headSection = document.getElementById('event-head-section');
  if (headSection) headSection.style.display = 'none';

  const actionBtns = document.getElementById('action-buttons');
  if (actionBtns) actionBtns.innerHTML = '';

  const tbody = document.getElementById('signups-tbody');
  if (tbody) tbody.innerHTML = '';

  document.getElementById('signups-content') && (document.getElementById('signups-content').style.display = 'none');
  document.getElementById('signups-empty') && (document.getElementById('signups-empty').style.display = 'none');
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
  const participantCurrent = Number(
    currentEvent.participantsignup ?? currentEvent.ParticipantSignUp ??
    currentEvent.peoplesignup ?? currentEvent.PeopleSignUp ??
    0
  );

  const participantMax = Number(
    currentEvent.maximumparticipant ?? currentEvent.MaximumParticipant ??
    currentEvent.maxparticipants ?? currentEvent.MaxParticipants ??
    currentEvent.participantlimit ?? currentEvent.ParticipantLimit ??
    0
  );
  const participantCurrentEl = document.getElementById('participant-current');
  const participantMaxEl = document.getElementById('participant-max');
  if (participantCurrentEl) participantCurrentEl.textContent = participantCurrent;
  if (participantMaxEl) participantMaxEl.textContent = participantMax ? participantMax : '∞';

  // Volunteer Stats
  const volunteerCurrent = Number(
    currentEvent.volunteer_signup_count ??
    currentEvent.volunteersignup ?? currentEvent.VolunteerSignUp ??
    0
  );

  const volunteerMax = Number(currentEvent.requiredvolunteers ?? currentEvent.RequiredVolunteers ?? 0);
  const volunteerCurrentEl = document.getElementById('volunteer-current');
  const volunteerMaxEl = document.getElementById('volunteer-max');
  if (volunteerCurrentEl) volunteerCurrentEl.textContent = volunteerCurrent;
  if (volunteerMaxEl) volunteerMaxEl.textContent = volunteerMax ? volunteerMax : '∞';

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

  // Setup check-in tabs if event is approved and belongs to this organization
  setupCheckInTabs();
}

// Display Event Head Section
function displayEventHeadSection() {
  const section = document.getElementById('event-head-section');
  const content = document.getElementById('event-head-content');
  if (!section || !content) return;

  // Event head info should come from eventbooking (authoritative after approval).
  // Fallback to application only if eventbooking info isn't available.
  const headName =
    currentEvent?.session_head_name || currentEvent?.SessionHeadName ||
    currentApplication?.session_head_name || currentApplication?.SessionHeadName;
  const headContact =
    currentEvent?.session_head_contact || currentEvent?.SessionHeadContact ||
    currentApplication?.session_head_contact || currentApplication?.SessionHeadContact;
  const headEmail =
    currentEvent?.session_head_email || currentEvent?.SessionHeadEmail ||
    currentApplication?.session_head_email || currentApplication?.SessionHeadEmail;
  const headProfile =
    currentEvent?.session_head_profile || currentEvent?.SessionHeadProfile ||
    currentApplication?.session_head_profile || currentApplication?.SessionHeadProfile;

  const headUserId =
    currentEvent?.eventHeadUserId || currentEvent?.eventheaduserid ||
    currentApplication?.eventHeadUserId || currentApplication?.eventheaduserid;

  const bookingId = currentEvent?.bookingid || currentEvent?.BookingID;

  const appStatus = currentApplication?.status || currentApplication?.Status;
  const eventOrgId = currentEvent?.organizationid || currentEvent?.OrganizationID;
  const appOrgId = currentApplication?.organizationid || currentApplication?.OrganizationID;
  const isMyOrg = organizationId && ((eventOrgId && (Number(organizationId) === Number(eventOrgId))) || (appOrgId && (Number(organizationId) === Number(appOrgId))));
  const isApproved = (appStatus?.toLowerCase() === 'approved') || Boolean(bookingId);

  // Show section if event is assigned to user's org
  if (isMyOrg || headName) {
    section.style.display = 'block';

    if (headName) {
      // Show event head details
      const initials = headName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
      const headProfileHref = headUserId ? `../Profile/profilepage.html?userId=${encodeURIComponent(headUserId)}` : null;
      content.innerHTML = `
        <div class="event-head-card"${headProfileHref ? ` role="button" tabindex="0" data-profile-href="${headProfileHref}"` : ''}>
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

      if (headProfileHref) {
        const card = content.querySelector('.event-head-card');
        if (card) {
          card.addEventListener('click', () => {
            window.location.href = headProfileHref;
          });
          card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              window.location.href = headProfileHref;
            }
          });
        }
      }
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
      const headName =
        currentEvent?.session_head_name || currentEvent?.SessionHeadName ||
        currentApplication?.session_head_name || currentApplication?.SessionHeadName;
      if (!headName && isMyOrg) {
        const infoMsg = document.createElement('div');
        infoMsg.className = 'status-message status-pending-msg';
        infoMsg.innerHTML = '<i class="fas fa-user-plus"></i> Assign an Event Head in the Event Head section below.';
        btnGroup.appendChild(infoMsg);
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


// book??
async function requestToBook(btn) {
  try {
    const currentEvent = JSON.parse(localStorage.getItem("currentEvent"));
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

    const response = await fetch(`${API_BASE}/organization/events/booking/request`, {
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
  const wrap = document.getElementById('hvCongrats');
  if (!wrap) return;

  // Optional: allow OK to redirect (institution pages sometimes want CTA behavior)
  if (buttonHref) {
    const ok = wrap.querySelector('#hvCongratsOk');
    if (ok && buttonText) ok.textContent = buttonText;
    wrap._onCloseOnce = () => {
      window.location.href = buttonHref;
    };
  } else {
    const ok = wrap.querySelector('#hvCongratsOk');
    if (ok) ok.textContent = 'OK';
    wrap._onCloseOnce = null;
  }

  showCongrats({
    title: title || 'Success!',
    message: message || ''
  });
}

let lastFocusBeforeAssignModal = null;
let activeAssignModal = null;

function closeAssignModal() {
  if (!activeAssignModal) return;
  const targetFocus = lastFocusBeforeAssignModal && document.contains(lastFocusBeforeAssignModal)
    ? lastFocusBeforeAssignModal
    : document.body;
  activeAssignModal.remove();
  activeAssignModal = null;
  if (targetFocus && typeof targetFocus.focus === 'function') targetFocus.focus();
}

// Open modal to assign event head
async function openAssignEventHeadModal() {
  if (activeAssignModal) {
    closeAssignModal();
  }
  lastFocusBeforeAssignModal = document.activeElement;

  let members = [];
  try {
    const membersResp = await fetch(`${API_BASE}/organization/members`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (membersResp.ok) {
      members = await membersResp.json();
      if (!Array.isArray(members)) members = [];
    }
  } catch (e) {
    console.error('Error fetching organization members:', e);
  }

  const memberOptions = members.length > 0
    ? members
      .map(m => {
        const name = (m.name || '').replace(/"/g, '&quot;');
        const email = (m.email || '').replace(/"/g, '&quot;');
        const phone = (m.phone || '').replace(/"/g, '&quot;');
        return `<option value="${m.id}" data-name="${name}" data-email="${email}" data-phone="${phone}">${m.name || 'Unnamed'}${m.email ? ` (${m.email})` : ''}</option>`;
      })
      .join('')
    : '';

  const modal = document.createElement('div');
  modal.className = 'booking-modal';
  modal.style.display = 'flex';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', 'Assign Event Head');
  modal.innerHTML = `
    <div class="booking-modal-content">
      <button class="close-modal" aria-label="Close">&times;</button>
      <h3><i class="fas fa-user-tie"></i> Assign Event Head</h3>
      <div class="booking-modal-body">
        <form id="assignEventHeadForm">
          ${members.length > 0 ? `
          <div class="form-group">
            <label for="memberSelect">Select Organization Member</label>
            <select id="memberSelect" name="memberSelect" style="width: 100%; padding: 0.9rem 1rem; border-radius: 12px; border: 2px solid #e2e8f0; font-size: 1rem;">
              <option value="">-- Choose a member --</option>
              ${memberOptions}
            </select>
            <div class="form-hint">Selecting a member will auto-fill the details below.</div>
          </div>
          ` : ``}
          <div class="form-group">
            <label for="eventHeadName">Full Name *</label>
            <input type="text" id="eventHeadName" name="eventHeadName" required placeholder="Enter full name">
          </div>
          <div class="form-group">
            <label for="eventHeadEmail">Email Address *</label>
            <input type="email" id="eventHeadEmail" name="eventHeadEmail" required placeholder="name@example.com">
          </div>
          <div class="form-group">
            <label for="eventHeadContact">Mobile Number *</label>
            <input type="tel" id="eventHeadContact" name="eventHeadContact" required placeholder="e.g. 9123 4567">
            <div class="form-hint">Include country code if needed.</div>
          </div>
          <div class="form-group">
            <label for="eventHeadProfile">Brief Profile (Optional)</label>
            <textarea id="eventHeadProfile" name="eventHeadProfile" rows="3" placeholder="Role, experience, or responsibilities..."></textarea>
          </div>

          <input type="hidden" id="eventHeadUserId" name="eventHeadUserId" value="">
          <div class="form-actions">
            <button type="button" id="assignCancelBtn" class="btn-secondary">
              <i class="fas fa-times"></i> Cancel
            </button>
            <button type="submit" class="btn-primary">
              <i class="fas fa-check"></i> Confirm Assignment
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  activeAssignModal = modal;

  const memberSelect = modal.querySelector('#memberSelect');
  if (memberSelect) {
    memberSelect.addEventListener('change', (e) => {
      const opt = e.target.selectedOptions?.[0];
      if (!opt || !opt.value) return;

      const name = opt.dataset.name || '';
      const email = opt.dataset.email || '';
      const phone = opt.dataset.phone || '';

      const nameInput = modal.querySelector('#eventHeadName');
      const emailInput = modal.querySelector('#eventHeadEmail');
      const phoneInput = modal.querySelector('#eventHeadContact');

      if (nameInput) nameInput.value = name;
      if (emailInput) emailInput.value = email;
      if (phoneInput) phoneInput.value = phone;

      const userIdInput = modal.querySelector('#eventHeadUserId');
      if (userIdInput) userIdInput.value = opt.value;
    });
  }

  modal.querySelector('.close-modal').addEventListener('click', () => closeAssignModal());
  modal.querySelector('#assignCancelBtn').addEventListener('click', () => closeAssignModal());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeAssignModal();
  });
  modal.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAssignModal();
  });
  modal.querySelector('#assignEventHeadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await assignEventHead(modal);
  });

  setTimeout(() => {
    const selectEl = modal.querySelector('#memberSelect');
    if (selectEl) selectEl.focus();
    else {
      const nameInput = modal.querySelector('#eventHeadName');
      if (nameInput) nameInput.focus();
    }
  }, 0);
}

// Assign event head API call
async function assignEventHead(modal) {
  try {
    const form = document.getElementById('assignEventHeadForm');
    const eventHeadName = form.eventHeadName.value.trim();
    const eventHeadContact = form.eventHeadContact.value.trim();
    const eventHeadEmail = form.eventHeadEmail.value.trim();
    const eventHeadProfile = form.eventHeadProfile.value.trim();
    const eventHeadUserId = form.eventHeadUserId ? form.eventHeadUserId.value.trim() : '';

    if (!eventHeadName || !eventHeadContact || !eventHeadEmail) {
      alert('Please fill in all required fields');
      return;
    }

    const eventId = Number(
      currentApplication?.eventid || currentApplication?.EventID ||
      currentEvent?.eventid || currentEvent?.EventID
    );
    if (!eventId) {
      alert('Event ID not found. Please refresh the page and try again.');
      return;
    }

    const appStatus = (currentApplication?.status || currentApplication?.Status || '').toString();
    const bookingId = currentEvent?.bookingid || currentEvent?.BookingID;
    const eventOrgId = currentEvent?.organizationid || currentEvent?.OrganizationID;
    const appOrgId = currentApplication?.organizationid || currentApplication?.OrganizationID;
    const isMyOrg = organizationId && ((eventOrgId && (Number(organizationId) === Number(eventOrgId))) || (appOrgId && (Number(organizationId) === Number(appOrgId))));
    const isApproved = Boolean(bookingId);

    if (!isApproved || !isMyOrg) {
      alert('You can only assign an Event Head after the event booking is approved for your organization.');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Assigning...';

    const response = await fetch(`${API_BASE}/organization/events/assign-head/${eventId}`, {
      method: 'PUT',
      headers: {   
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        eventHeadName,
        eventHeadContact,
        eventHeadEmail,
        eventHeadProfile,
        eventHeadUserId
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to assign event head');
    }

    const result = await response.json().catch(() => null);

    closeAssignModal();
    showCongrats({
      title: 'Event Head Assigned',
      message: 'Event head information has been saved successfully.'
    });
    
    // Update event data and persist to localStorage so refresh keeps changes
    if (!currentEvent) currentEvent = {};
    const bookingData = result?.data || result?.booking || result;
    currentEvent.session_head_name = bookingData?.session_head_name || eventHeadName;
    currentEvent.session_head_contact = bookingData?.session_head_contact || eventHeadContact;
    currentEvent.session_head_email = bookingData?.session_head_email || eventHeadEmail;
    currentEvent.session_head_profile = bookingData?.session_head_profile || eventHeadProfile;
    if (eventHeadUserId) currentEvent.eventHeadUserId = eventHeadUserId;
    localStorage.setItem('currentEvent', JSON.stringify(currentEvent));

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

// Setup check-in tabs for approved events
function setupCheckInTabs() {
  const appStatus = currentApplication?.status || currentApplication?.Status;
  const eventOrgId = currentEvent?.organizationid || currentEvent?.OrganizationID;
  const appOrgId = currentApplication?.organizationid || currentApplication?.OrganizationID;
  const isMyOrg = organizationId && ((eventOrgId && (Number(organizationId) === Number(eventOrgId))) || (appOrgId && (Number(organizationId) === Number(appOrgId))));
  const isApproved = (appStatus?.toLowerCase() === 'approved');

  // Show check-in tabs only for approved events that belong to this organization
  if (isApproved && isMyOrg) {
    const tabsContainer = document.getElementById('checkin-tabs-container');
    if (tabsContainer) {
      tabsContainer.style.display = 'block';
      initTabs();
      setupQRButton();
    }
  }
}

// Tab switching functionality
function initTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.getAttribute('data-tab');

      // Remove active class from all buttons and contents
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));

      // Add active class to clicked button and corresponding content
      button.classList.add('active');
      const targetContent = document.getElementById(`tab-${targetTab}`);
      if (targetContent) {
        targetContent.classList.add('active');
      }

      // If switching to check-in tab, fetch signups
      if (targetTab === 'checkin') {
        fetchEventSignups();
      }
    });
  });
}

// Setup QR button
function setupQRButton() {
  const generateQRBtn = document.getElementById('generate-qr');
  if (generateQRBtn) {
    generateQRBtn.addEventListener('click', () => {
      const eventId = currentEvent.eventid || currentEvent.EventID;
      if (eventId) {
        window.location.href = `../Admin/attendance.html?eventId=${eventId}`;
      }
    });
  }
}

// Fetch event signups for attendance tracking
async function fetchEventSignups() {
  const loadingEl = document.getElementById('signups-loading');
  const contentEl = document.getElementById('signups-content');
  const emptyEl = document.getElementById('signups-empty');
  const tbodyEl = document.getElementById('signups-tbody');
  const statTotalEl = document.getElementById('stat-total');
  const statNeededEl = document.getElementById('stat-needed');

  try {
    // Show loading state
    loadingEl.style.display = 'flex';
    contentEl.style.display = 'none';
    emptyEl.style.display = 'none';

    const eventId = currentEvent.eventid || currentEvent.EventID;
    const response = await fetch(
      `${API_BASE}/organisations/events/${eventId}/people-signups`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch signups: ${response.status}`);
    }

    const data = await response.json();
    
    // Hide loading
    loadingEl.style.display = 'none';

    // Handle response structure
    let volunteerList = [];
    let volunteerCount = 0;
    
    if (Array.isArray(data)) {
      volunteerList = data;
      volunteerCount = data.length;
    } else {
      volunteerList = data.volunteers || data.signups || [];
      volunteerCount = data.count || volunteerList.length;
    }

    // Update statistics
    statTotalEl.textContent = volunteerCount;
    statNeededEl.textContent = currentEvent?.requiredvolunteers || currentEvent?.RequiredVolunteers || '-';
    
    // Check if we have volunteers
    if (volunteerList.length > 0) {
      tbodyEl.innerHTML = '';

      volunteerList.forEach((volunteer, index) => {
        // Handle attendance data
        const checkInTime = volunteer.checkin_time ? new Date(volunteer.checkin_time) : null;
        const checkOutTime = volunteer.checkout_time ? new Date(volunteer.checkout_time) : null;

        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${index + 1}</td>
          <td>
            <div style="font-weight: 600; color: #1f2937;">${volunteer.name}</div>
            <div style="font-size: 0.75rem; color: #6b7280;">${volunteer.role}</div>
          </td>
          <td>
            <div style="color: #374151;">${volunteer.email}</div>
            <div style="font-size: 0.75rem; color: #6b7280;">${volunteer.phone || 'No phone'}</div>
          </td>
          <td>
            ${checkInTime ? `
              <div style="color: #374151;">${checkInTime.toLocaleDateString()}</div>
              <div style="font-size: 0.75rem; color: #6b7280;">${checkInTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
            ` : '<div style="color: #9ca3af; font-style: italic;">Not checked in</div>'}
          </td>
          <td>
            ${checkOutTime ? `
              <div style="color: #374151;">${checkOutTime.toLocaleDateString()}</div>
              <div style="font-size: 0.75rem; color: #6b7280;">${checkOutTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
            ` : '<div style="color: #9ca3af; font-style: italic;">Not checked out</div>'}
          </td>
        `;

        tbodyEl.appendChild(row);
      });

      contentEl.style.display = 'block';
      emptyEl.style.display = 'none';
    } else {
      // No volunteers found
      contentEl.style.display = 'none';
      emptyEl.style.display = 'block';
      emptyEl.innerHTML = `
        <i class="fas fa-users" style="font-size: 3rem; color: #d1d5db; margin-bottom: 1rem;"></i>
        <p style="color: #6b7280; font-size: 1.1rem; margin-bottom: 0.5rem;">No volunteers have signed up for this event yet.</p>
        <p style="color: #9ca3af; font-size: 0.875rem;">Volunteers will appear here once they sign up for this event</p>
      `;
    }

  } catch (error) {
    console.error('Error fetching volunteer signups:', error);
    loadingEl.style.display = 'none';
    contentEl.style.display = 'none';
    emptyEl.style.display = 'block';
    emptyEl.innerHTML = `
      <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444; margin-bottom: 1rem;"></i>
      <p style="color: #ef4444; font-size: 1.1rem; margin-bottom: 0.5rem;">Error Loading Volunteers</p>
      <p style="color: #9ca3af; font-size: 0.875rem;">Unable to fetch volunteer information. Please try again.</p>
      <button onclick="fetchEventSignups()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #f4a261; color: white; border: none; border-radius: 6px; cursor: pointer;">
        Retry
      </button>
    `;
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  setupCongratsOverlay();

  // clear previous event state before loading new one
  resetEventDetailPage();

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
