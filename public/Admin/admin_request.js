

token = localStorage.getItem('token');

if (!token) {
  // Redirect to login page if not authenticated
  window.location.href = '../../index.html';
}

// Get the application/request data from localStorage
// Check for both 'currentApplication' (stored by homepage_admin.js) and 'currentRequest' (fallback)
const applicationData = localStorage.getItem('currentApplication') || localStorage.getItem('currentRequest');
const currentApplication = applicationData ? JSON.parse(applicationData) : null;

if (!currentApplication || (!currentApplication.requestid && !currentApplication.RequestID)) {
  alert('No request selected');
  window.location.href = './homepage_admin.html';
}

// Use requestid (database field) or fallback to RequestID
const currentRequestId = currentApplication.requestid || currentApplication.RequestID;

async function fetchRequestDetails() {
  try {
    const response = await fetch(`https://fsdp-cycling-ltey.onrender.com/requests/details/${currentRequestId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch request details');
    }
    const requestData = await response.json();
    displayRequestDetails(requestData);
    
  } catch (error) {
    console.error('Error fetching request details:', error);
  } 
}


function displayRequestDetails(data) {
  // Handle both lowercase (PostgreSQL) and uppercase (legacy) field names
  const eventName = data.eventname || data.EventName;
  const createdAt = data.createdat || data.CreatedAt;
  const description = data.description || data.Description;
  const eventDate = data.eventdate || data.EventDate;
  const requiredVolunteers = data.requiredvolunteers || data.RequiredVolunteers;
  const organizationId = data.organizationid || data.OrganizationID;
  const requestId = data.requestid || data.RequestID;

  document.getElementById('req-name').textContent = eventName;
  document.getElementById('req-created').textContent = new Date(createdAt).toLocaleDateString();
  document.getElementById('req-desc').textContent = description || '';
  document.getElementById("req-participant").textContent = `${data.participantsignup } / ${data.maximumparticipant}`;
  document.getElementById('req-date').textContent = new Date(eventDate).toLocaleDateString();
  document.getElementById('req-needed').textContent = requiredVolunteers;
  document.getElementById('req-org').textContent = organizationId;
  document.getElementById('req-user').textContent = requestId;
}




const approve  = document.getElementById("approve")
const reject  = document.getElementById("reject")

async function checkRequestStatus() {
  try {
    const response = await fetch(
      `https://fsdp-cycling-ltey.onrender.com/requests/status/${currentRequestId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to get request status');
    }

    
   const { status } = await response.json();

    // -----  -----

    if(status === 'Rejected') {
      reject.disabled = true;
      approve.disabled = false;

      reject.innerText = "Rejected";
      reject.style.backgroundColor = "#E5E5E5";
      reject.style.color = "white";

      approve.style.backgroundColor = "#4CAF50";
      approve.style.color = "white";
    }
    else if(status === 'Approved') {
      approve.disabled = true;
      reject.disabled = false;

      approve.innerText = "Approved";
      approve.style.backgroundColor = "#E5E5E5";
      approve.style.color = "white";

      reject.style.backgroundColor = "#E53935";
      reject.style.color = "white";
    }
    else {
      // Pending
      approve.disabled = false;
      reject.disabled = false;

      approve.style.backgroundColor = "#4CAF50";
      reject.style.backgroundColor = "#E53935";
    }

  } catch (error) {
    console.error('Error fetching request status:', error);
  }
}


async function assignEventToOrgan(){
   try {
    const eventId = currentApplication.eventid || currentApplication.EventID;
    const organizationId = currentApplication.organizationid || currentApplication.OrganizationID;
    
    const response = await fetch(`https://fsdp-cycling-ltey.onrender.com/admin/assign_events`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
  event_id: eventId,
  organization_id: organizationId
})
    });
    if (!response.ok) {
      throw new Error('Failed to update request');
    }
    const requestData = await response.json();

    showCongrats('Approved! Event is now open for volunteers. Emails are being sent.');
    
    
  } catch (error) {
    console.error('Error fetching request details:', error);
    alert('Approval succeeded, but assigning the event (and sending emails) failed. Please try again.');
    throw error;
  } 
}

approve.addEventListener("click",async function(){
 try {
    approve.disabled = true;
    reject.disabled = true;
    const response = await fetch(`https://fsdp-cycling-ltey.onrender.com/requests/approve/${currentRequestId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error('Failed to update request');
    }
    const requestData = await response.json();
    await assignEventToOrgan();
    const organizationId = currentApplication.organizationid || currentApplication.OrganizationID;
      approve.disabled = true;
    reject.disabled = false;

    approve.style.backgroundColor = "#4CAF50";   // green
    reject.style.backgroundColor = "#E53935";    // red
    
    
  } catch (error) {
    console.error('Error fetching request details:', error);
    approve.disabled = false;
    reject.disabled = false;
  } 
})

function ensureCongratsOverlay() {
  if (document.getElementById('hvCongrats')) return;

  const wrap = document.createElement('div');
  wrap.id = 'hvCongrats';
  wrap.className = 'hv-congrats';
  wrap.innerHTML = `
    <div class="hv-congrats__backdrop" data-close="true"></div>
    <div class="hv-congrats__dialog" role="dialog" aria-modal="true" aria-label="Congratulations">
      <div class="hv-confetti" aria-hidden="true"></div>
      <div class="hv-congrats__body">
        <div class="hv-congrats__icon" aria-hidden="true">✓</div>
        <h3 class="hv-congrats__title">Congratulations!</h3>
        <p class="hv-congrats__msg" id="hvCongratsMsg"></p>
      </div>
      <div class="hv-congrats__footer">
        <button class="hv-congrats__btn" type="button" id="hvCongratsOk">OK</button>
      </div>
    </div>
  `;

  document.body.appendChild(wrap);

  const close = () => wrap.classList.remove('is-open');
  wrap.addEventListener('click', (e) => {
    if (e.target?.dataset?.close === 'true') close();
  });
  const ok = wrap.querySelector('#hvCongratsOk');
  if (ok) ok.addEventListener('click', close);
}

function launchConfetti(container) {
  if (!container) return;
  container.innerHTML = '';
  const colors = ['#ea8d2a', '#16a34a', '#2563eb', '#dc2626', '#0f172a', '#f59e0b'];
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

function showCongrats(message) {
  ensureCongratsOverlay();
  const wrap = document.getElementById('hvCongrats');
  if (!wrap) return;
  const msg = wrap.querySelector('#hvCongratsMsg');
  if (msg) msg.textContent = message || '';
  const confetti = wrap.querySelector('.hv-confetti');
  launchConfetti(confetti);
  wrap.classList.add('is-open');

  window.clearTimeout(wrap._autoCloseTimer);
  wrap._autoCloseTimer = window.setTimeout(() => {
    wrap.classList.remove('is-open');
  }, 2400);
}




reject.addEventListener("click",async function(){
  try {
    const response = await fetch(`https://fsdp-cycling-ltey.onrender.com/requests/reject/${currentRequestId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error('Failed to update request');
    }
    const requestData = await response.json();
    const organizationId = currentApplication.organizationid || currentApplication.OrganizationID;
    alert(`Request from Organization ${organizationId} has been rejected!`)
      reject.disabled = true;
    approve.disabled = false;

    reject.style.backgroundColor = "#E53935";     // red
    approve.style.backgroundColor = "#4CAF50";    // green
    
  } catch (error) {
    console.error('Error fetching request details:', error);
  } 
})



document.addEventListener('DOMContentLoaded', () => {
  fetchRequestDetails();
  checkRequestStatus()
 
});


