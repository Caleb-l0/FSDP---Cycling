

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
  document.getElementById("req-participant").textContent = `${data.maximumparticipant} / ${data.participantsignup || 'N/A'}`;
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
    
    
  } catch (error) {
    console.error('Error fetching request details:', error);
  } 
}

approve.addEventListener("click",async function(){
 try {
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
    assignEventToOrgan()
    const organizationId = currentApplication.organizationid || currentApplication.OrganizationID;
    alert(`Request from Organization ${organizationId} has been approved!`)
      approve.disabled = true;
    reject.disabled = false;

    approve.style.backgroundColor = "#4CAF50";   // green
    reject.style.backgroundColor = "#E53935";    // red
    
    
  } catch (error) {
    console.error('Error fetching request details:', error);
  } 
})




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


