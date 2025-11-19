token = localStorage.getItem('token');

if (!token) {
  // Redirect to login page if not authenticated
  window.location.href = 'login.html';
}

currentRequest = JSON.parse(localStorage.getItem('currentRequest'));



window.addEventListener("DOMContentLoaded", () => {
  if (!currentRequest) return;
  document.getElementById("eventName").value = currentRequest.EventName || "";

  document.getElementById("eventLocation").value = currentRequest.Location || "";

 
  if (currentRequest.EventDate) {
    document.getElementById("eventDate").value =
      currentRequest.EventDate.slice(0, 16); 
  }

  
  document.getElementById("volunteers").value =
    currentRequest.RequiredVolunteers || "";
  


  document.getElementById("organizer").value =
    currentRequest.OrganizationID || "";



  document.getElementById("description").value =
    currentRequest.Description || "";

 
  document.getElementById("status").value =
    currentRequest.Status || "Upcoming";


}
);



async function createEvent() {
  const eventData = {
    VolunteerRequestID: currentRequest.RequestID,
    OrganizationID: currentRequest.OrganizationID,
    EventName: document.getElementById("eventName").value,
    EventDate: document.getElementById("eventDate").value,
    Description: document.getElementById("description").value,
    RequiredVolunteers: document.getElementById("volunteers").value,
    MaximumParticipant: document.getElementById("participant").value,
    PeopleSignUp: 0,
    Status: document.getElementById("status").value
  };


  
  try {
    const response = await fetch("http://localhost:3000/admin/create_events", {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventData)
    });

    const result = await response.json();
    console.log(result);
    alert("Event created successfully!");
    //const OrganID = getOrganisationID();
    //const AllUserEmail = getUserEmail(OrganID);

    window.location.href='./homepage_login_Admin.html'
  
   

  } catch (error) {
    console.error("Error creating event:", error);
  }
}

document.getElementById("eventForm").addEventListener("submit", function(e) {
  e.preventDefault(); 
  createEvent();      
});






//  trash
async function deleteRequest(id){
   
  try {
    const response = await fetch(`http://localhost:3000/request/delete/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      
    });

    const result = await response.json();
    console.log(result);
    
    

 

  } catch (error) {
    console.error("Error deleting request:", error);
  }
}