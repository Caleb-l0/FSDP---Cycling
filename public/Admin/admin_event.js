const token = localStorage.getItem('token');
if (!token) {
  window.location.href = '../../index.html';
}

const currentEvent = JSON.parse(localStorage.getItem('currentEvent'));

// Check for eventid (database field) or id (fallback)
if (!currentEvent || (!currentEvent.eventid && !currentEvent.id)) {
  alert('No event selected');
  window.location.href = './homepage_admin.html';
}

// Use eventid (database field) or fallback to id
const currentEventId = currentEvent.eventid || currentEvent.id;


function getUserFromToken() {
  try {
    const payloadBase64 = token.split('.')[1];
    const payloadJson = atob(payloadBase64);
    const payload = JSON.parse(payloadJson);
    return {
      id: payload.id,
      role: payload.role
    };
  } catch (err) {
    console.error('Failed to decode token', err);
    return { id: null, role: null };
  }
}

const { id: userId, role: userRole } = getUserFromToken();
console.log('User Role:', userRole);

// DOM
const nameEl    = document.getElementById('req-name');
const dateEl    = document.getElementById('req-date');
const orgEl     = document.getElementById('req-org');
const createdEl = document.getElementById('req-created');
const locEl     = document.getElementById('req-loc');
const neededEl  = document.getElementById('req-needed');
const idEl      = document.getElementById('req-user');
const descEl    = document.getElementById('req-desc');

const btnApprove = document.getElementById('btn-approve');
const btnReject  = document.getElementById('btn-reject');
const btnEdit    = document.getElementById('btn-edit');
const btnDelete  = document.getElementById('btn-delete');
const btnSignup  = document.getElementById('btn-signup');
const btnCancel  = document.getElementById('btn-cancel');
const btnGenerateQR = document.getElementById('generate-qr');

function hideAllButtons() {
  [
    btnApprove,
    btnReject,
    btnEdit,
    btnDelete,
    btnSignup,
    btnCancel
  ].forEach(btn => {
    if (btn) btn.style.display = 'none';
  });
}

function setupButtonsByRole(role) {
  hideAllButtons();

  // This is an admin page - always show edit and delete buttons
  // (Access control is handled by authentication)
  if (btnEdit) btnEdit.style.display = 'inline-block';
  if (btnDelete) btnDelete.style.display = 'inline-block';
  
  // Also handle volunteer role if needed (shouldn't happen on admin page)
  if (role === 'volunteer') {
    if (btnSignup) btnSignup.style.display = 'inline-block';
    if (btnCancel) btnCancel.style.display = 'inline-block';
  }
}

async function fetchEventDetails() {
  try {
    const response = await fetch(`https://fsdp-cycling-ltey.onrender.com/events/${currentEventId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch event details');
    }

    const event = await response.json();

   nameEl.textContent = event.eventname;
dateEl.textContent = new Date(event.eventdate).toLocaleDateString();
orgEl.textContent = event.organizationid;
createdEl.textContent = event.createdat
  ? new Date(event.createdat).toLocaleDateString()
  : '-';
locEl.textContent = event.location || '-';
neededEl.textContent = event.requiredvolunteers;
idEl.textContent = event.eventid || event.id;
descEl.textContent = event.description || 'No description';


    setupButtonsByRole(userRole);
  } catch (error) {
    console.error('Error fetching event details:', error);
  }
}


function initButtonHandlers() {
  if (btnEdit) {
    btnEdit.addEventListener('click', () => {
      window.location.href = "./edit_event.html";
    });
  }

  if (btnDelete) {
    btnDelete.addEventListener("click", async function () {
      try {
        const ok = confirm("Are you sure you want to delete this event?");
        if (!ok) return;

        // Use admin delete endpoint (backend will check for bookings/participants)
        const res = await fetch(`https://fsdp-cycling-ltey.onrender.com/admin/events/${currentEventId}`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) {
          const errorData = await res.json();
          alert("❌ " + (errorData.message || "Failed to delete event"));
          return;
        }

        const msg = await res.json();
        alert("✔ Event deleted successfully");
        window.location.href = "./homepage_login_Admin.html";
      } catch (error) {
        console.error("Error deleting event:", error);
        alert("❌ Error: " + (error.message || "Failed to delete event"));
      }
    });
  }

  if (btnGenerateQR) {
    btnGenerateQR.addEventListener('click', () => {
      window.location.href = `attendance.html?eventId=${currentEventId}`;
    });
  }

  if (btnSignup) {
    btnSignup.addEventListener('click', async () => {
      try {
        const res = await fetch(`https://fsdp-cycling-ltey.onrender.com/events/${currentEventId}/signup`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await res.json();

        if (!res.ok) {
          alert(data.message || 'Failed to sign up');
          return;
        }

        alert('Signed up successfully');
      } catch (err) {
        console.error('Error signing up:', err);
      }
    });
  }

  if (btnCancel) {
    btnCancel.addEventListener('click', async () => {
      try {
        const res = await fetch(`https://fsdp-cycling-ltey.onrender.com/events/${currentEventId}/signup`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await res.json();

        if (!res.ok) {
          alert(data.message || 'Failed to cancel signup');
          return;
        }

        alert('Signup cancelled');
      } catch (err) {
        console.error('Error cancelling signup:', err);
      }
    });
  }
}

//--------------------

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

// Fetch event signups - Completely rewritten
async function fetchEventSignups() {
  const loadingEl = document.getElementById('signups-loading');
  const contentEl = document.getElementById('signups-content');
  const emptyEl = document.getElementById('signups-empty');
  const tbodyEl = document.getElementById('signups-tbody');
  const statTotalEl = document.getElementById('stat-total');
  const statNeededEl = document.getElementById('stat-needed');

  try {
    // Show loading state
    loadingEl.style.display = 'block';
    contentEl.style.display = 'none';
    emptyEl.style.display = 'none';

    console.log('Fetching signups for event ID:', currentEventId);
    console.log('Current event:', currentEvent);
    console.log('Token being used:', token ? 'Token exists' : 'No token');
    console.log('Token length:', token ? token.length : 0);

    const response = await fetch(
      `https://fsdp-cycling-ltey.onrender.com/organisations/events/${currentEventId}/people-signups`,
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
    
    console.log('Response from backend:', data);
    console.log('Response status:', response.status);

    // Hide loading
    loadingEl.style.display = 'none';

    // Handle multiple possible response structures:
    // 1. Object with volunteers array: { volunteers: [...] }
    // 2. Object with signups array: { signups: [...] }
    // 3. Direct array: [...]
    // 4. Object with count: { count: N, volunteers: [...] }
    
    let volunteerList = [];
    let volunteerCount = 0;
    
    if (Array.isArray(data)) {
      // Direct array response
      volunteerList = data;
      volunteerCount = data.length;
      console.log('Received direct array with', volunteerCount, 'volunteers');
    } else {
      // Object response
      volunteerList = data.volunteers || data.signups || [];
      volunteerCount = data.count || volunteerList.length;
      console.log('Received object with', volunteerCount, 'volunteers');
    }
    
    console.log('Final volunteer list:', volunteerList);

    // Update statistics
    statTotalEl.textContent = volunteerCount;
    statNeededEl.textContent = neededEl ? neededEl.textContent : (currentEvent?.requiredvolunteers || '-');
    
    // Check if we have volunteers
    if (volunteerList.length > 0) {
      tbodyEl.innerHTML = '';

      volunteerList.forEach((volunteer, index) => {
        // Handle different possible date field names
        const signupDate = new Date(volunteer.signupDate || volunteer.signupdate || new Date());
        const checkedIn = volunteer.checkedIn === true;

        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${index + 1}</td>
          <td>
            <div style="font-weight: 600; color: #1f2937;">${volunteer.name}</div>
            <div style="font-size: 0.75rem; color: #6b7280;">${volunteer.role}</div>
          </td>
          <td>
            <div style="color: #374151;">${volunteer.email}</div>
            <div style="font-size: 0.75rem; color: #6b7280;">${volunteer.phone}</div>
          </td>
          <td>
            <div style="color: #374151;">${signupDate.toLocaleDateString()}</div>
            <div style="font-size: 0.75rem; color: #6b7280;">${signupDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
          </td>
          <td style="text-align:center;">
            <input 
              type="checkbox"
              ${checkedIn ? 'checked' : ''}
              disabled
              style="transform: scale(1.2);"
            />
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
        <p style="color: #6b7280; font-size: 1.1rem; margin-bottom: 0.5rem;">${data.message || 'No volunteers have signed up for this event yet'}</p>
        <p style="color: #9ca3af; font-size: 0.875rem;">Volunteers will appear here once they sign up for this event</p>
      `;
    }

  } catch (error) {
    console.error('Error fetching volunteer signups:', error);
    loadingEl.style.display = 'none';
    contentEl.style.display = 'none';
    emptyEl.style.display = 'block';
    
    // Check if it's an authentication error
    if (error.message.includes('403') || error.message.includes('Invalid token')) {
      emptyEl.innerHTML = `
        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444; margin-bottom: 1rem;"></i>
        <p style="color: #ef4444; font-size: 1.1rem; margin-bottom: 0.5rem;">Session Expired</p>
        <p style="color: #9ca3af; font-size: 0.875rem; margin-bottom: 1rem;">Your login session has expired. Please log in again.</p>
        <button onclick="handleExpiredSession()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #dc2626; color: white; border: none; border-radius: 6px; cursor: pointer;">
          Go to Login
        </button>
      `;
    } else {
      emptyEl.innerHTML = `
        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444; margin-bottom: 1rem;"></i>
        <p style="color: #ef4444; font-size: 1.1rem; margin-bottom: 0.5rem;">Error Loading Volunteers</p>
        <p style="color: #9ca3af; font-size: 0.875rem;">Unable to fetch volunteer information. Please try again.</p>
        <button onclick="fetchEventSignups()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #ea8d2a; color: white; border: none; border-radius: 6px; cursor: pointer;">
          Retry
        </button>
      `;
    }
  }
}

// Handle expired session
function handleExpiredSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('currentEvent');
  localStorage.removeItem('openCheckInTab');
  window.location.href = '../../index.html';
}


document.addEventListener('DOMContentLoaded', () => {
  hideAllButtons();
  fetchEventDetails();
  initButtonHandlers();
  initTabs();
  
  // Check if we should open the check-in tab automatically
  const openCheckInTab = localStorage.getItem('openCheckInTab');
  if (openCheckInTab === 'true') {
    // Clear the flag
    localStorage.removeItem('openCheckInTab');
    
    // Wait a bit for the page to load, then switch to check-in tab
    setTimeout(() => {
      const checkInTabButton = document.querySelector('[data-tab="checkin"]');
      if (checkInTabButton) {
        checkInTabButton.click();
      }
    }, 500);
  }
});

