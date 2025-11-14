token = localStorage.getItem('token');

if (!token) {
  // Redirect to login page if not authenticated
  window.location.href = 'login.html';
}


currentRequest = JSON.parse(localStorage.getItem('currentRequest'));
async function fetchRequestDetails() {
  try {
    const response = await fetch(`http://localhost:3000/requests/details/${currentRequest.RequestID}`, {
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
  
  document.getElementById('req-date').textContent = new Date(data.EventDate).toLocaleDateString();
  document.getElementById('req-needed').textContent = data.RequiredVolunteers;
  document.getElementById('req-org').textContent = data.OrganizationID;
  document.getElementById('req-user').textContent = data.RequestID;
}

document.querySelector('.btn-create').addEventListener('click', createEvent);
document.querySelector('.btn-reject').addEventListener('click', rejectEvent);
document.querySelector('.btn-message').addEventListener('click', ChatWithOrgan);

function createEvent(){
  
window.location.href='./createEvent.html'
}


function rejectEvent(){

}

function ChatWithOrgan(){

}

document.addEventListener('DOMContentLoaded', () => {
  fetchRequestDetails();
});


