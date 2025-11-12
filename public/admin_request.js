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
  document.getElementById('requester-name').textContent = data.requesterName;
  document.getElementById('request-date').textContent = new Date(data.requestDate).toLocaleDateString();
  document.getElementById('request-description').textContent = data.description;
  // Populate other fields as necessary
}



document.addEventListener('DOMContentLoaded', () => {
  fetchRequestDetails();
});
