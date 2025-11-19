token = localStorage.getItem('token');

if (!token) {
  // Redirect to login page if not authenticated
  window.location.href = 'login.html';
}

currentRequest = JSON.parse(localStorage.getItem('currentRequest'));



window.addEventListener("DOMContentLoaded", () => {
  if (!currentRequest) return;
  document.getElementById("eventName").value = currentRequest.EventName || "";

  document.getElementById("eventLocation").value = currentRequest.EventLocation || "";

 
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
  // Get form values
  const eventName = document.getElementById("eventName").value.trim();
  const eventDate = document.getElementById("eventDate").value;
  const organizerValue = document.getElementById("organizer").value.trim();
  const volunteersValue = document.getElementById("volunteers").value;
  
  // Check if currentRequest exists, otherwise get values from form
  const organizationID = currentRequest ? currentRequest.OrganizationID : organizerValue;
  const volunteerRequestID = currentRequest ? currentRequest.RequestID : null;

  // Validate required fields with specific error messages
  const missingFields = [];
  if (!eventName) missingFields.push("Event Name");
  if (!eventDate) missingFields.push("Date & Time");
  if (!volunteersValue) missingFields.push("Required Volunteers");

  if (missingFields.length > 0) {
    alert(`Please fill in the following required fields:\n- ${missingFields.join('\n- ')}`);
    return;
  }

  // Parse OrganizationID - optional, but if provided must be valid
  let parsedOrgID = null;
  if (organizerValue || currentRequest) {
    parsedOrgID = parseInt(organizationID);
    if (isNaN(parsedOrgID) || parsedOrgID <= 0) {
      alert("Organizer must be a valid organization ID (positive number).\n\nIf you don't have an organization ID, you can leave it empty or enter a valid number from the Organizations table.");
      return;
    }
  }

  // Parse RequiredVolunteers - must be a valid number
  const parsedVolunteers = parseInt(volunteersValue);
  if (isNaN(parsedVolunteers) || parsedVolunteers <= 0) {
    alert("Required Volunteers must be a valid positive number.");
    return;
  }

  const eventData = {
    EventName: eventName,
    EventDate: eventDate,
    Description: document.getElementById("description").value.trim(),
    RequiredVolunteers: parsedVolunteers,
    Status: document.getElementById("status").value
  };

  const location = document.getElementById("eventLocation").value;
  if (location && location.trim() !== '') {
    eventData.EventLocation = location;
  }


  // Only include OrganizationID if it's provided
  if (parsedOrgID) {
    eventData.OrganizationID = parsedOrgID;
  }

  // Only include VolunteerRequestID if it exists
  if (volunteerRequestID) {
    eventData.VolunteerRequestID = volunteerRequestID;
  }
  
  try {
    const response = await fetch("http://localhost:3000/admin/create_events", {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventData)
    });

    // Check if response is JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("Server returned non-JSON response:", text.substring(0, 200));
      throw new Error(`Server error: Received HTML instead of JSON. Status: ${response.status}`);
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || errorData.error || 'Failed to create event');
    }

    const result = await response.json();
    console.log(result);
    alert("Event created successfully!");
   window.location.href='./homepage_login_Admin.html'

  } catch (error) {
    console.error("Error creating event:", error);
    alert(`Failed to create event: ${error.message}`);
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