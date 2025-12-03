

token = localStorage.getItem('token');

if (!token) {
  // Redirect to login page if not authenticated
  window.location.href = '../../index.html';
}


currentRequest = JSON.parse(localStorage.getItem('currentRequest'));
async function fetchRequestDetails() {
  try {
    const response = await fetch(`https://fsdp-cycling-ltey.onrender.com/requests/details/${currentRequest.RequestID}`, {
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
  document.getElementById('req-name').textContent = data.EventName;
 
  document.getElementById('req-created').textContent = new Date(data.CreatedAt).toLocaleDateString();
  document.getElementById('req-desc').textContent = data. Description;
  document.getElementById("req-participant").textContent = data.ParticipantNumber;
  document.getElementById('req-date').textContent = new Date(data.EventDate).toLocaleDateString();
  document.getElementById('req-needed').textContent = data.RequiredVolunteers;
  document.getElementById('req-org').textContent = data.OrganizationID;
  document.getElementById('req-user').textContent = data.RequestID;
}




const approve  = document.getElementById("approve")
const reject  = document.getElementById("reject")

async function checkRequestStatus() {
  try {
    const response = await fetch(
      `https://fsdp-cycling-ltey.onrender.com/requests/status/${currentRequest.RequestID}`,
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
    const response = await fetch(`https://fsdp-cycling-ltey.onrender.com/admin/assign_events`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
  event_id: currentRequest.EventID,
  organization_id: currentRequest.OrganizationID
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
    const response = await fetch(`https://fsdp-cycling-ltey.onrender.com/requests/approve/${currentRequest.RequestID}`, {
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
    alert(`Request from Organization ${currentRequest.OrganizationID} has been approved!`)
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
    const response = await fetch(`https://fsdp-cycling-ltey.onrender.com/requests/reject/${currentRequest.RequestID}`, {
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
    alert(`Request from Organization ${currentRequest.OrganizationID} has been rejected!`)
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


