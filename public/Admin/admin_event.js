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



document.addEventListener('DOMContentLoaded', () => {
  hideAllButtons();
  fetchEventDetails();
  initButtonHandlers();
});
