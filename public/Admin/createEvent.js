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
  const MaximumParticipant = document.getElementById("participant").value;
 const Location = document.getElementById("eventLocation").value;
  // Check if currentRequest exists, otherwise get values from form

  const organizationID = currentRequest ? currentRequest.OrganizationID : organizerValue;
 

  // Validate required fields with specific error messages
  const missingFields = [];
  if (!eventName) missingFields.push("Event Name");
  if (!eventDate) missingFields.push("Date & Time");
  if (!volunteersValue) missingFields.push("Required Volunteers");

  if (missingFields.length > 0) {
    alert(`Please fill in the following required fields:\n- ${missingFields.join('\n- ')}`);
    return;
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
    Status: document.getElementById("status").value,
    MaximumParticipant:   MaximumParticipant,
    OrganizationID: organizerValue,
    Location: Location,
    

  };





  try {
    const response = await fetch("https://fsdp-cycling-ltey.onrender.com/admin/create_events", {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventData)
    });

    const conflict = await checkConflict(Location, eventDate);

if (conflict) {
  alert("This time slot is unavailable for the selected location.");
  return;
}

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
    const response = await fetch(`https://fsdp-cycling-ltey.onrender.com/request/delete/${id}`, {
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



// calendar logic

async function checkConflict(location, datetime) {
  const date = datetime.slice(0, 10);
  const time = datetime.slice(11, 16);

  const response = await fetch(
    `https://fsdp-cycling-ltey.onrender.com/events/by-location?location=${encodeURIComponent(location)}&date=${date}`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );

  if (!response.ok) {
    
    console.error("checkConflict error status:", response.status);
    return false;
  }

  const events = await response.json(); 
  return events.some(ev => {
    const evDate = typeof ev.EventDate === 'string'
      ? ev.EventDate
      : new Date(ev.EventDate).toISOString();
    const evTime = evDate.slice(11, 16);
    return evTime === time;
  });
}




document.getElementById("eventLocation").addEventListener("change", loadCalendar);
document.getElementById("eventDate").addEventListener("change", loadCalendar);

async function loadCalendar() {
  const location = document.getElementById("eventLocation").value;
  const datetime = document.getElementById("eventDate").value;

  if (!location || !datetime) {
    document.getElementById("calendarContent").innerHTML =
      "<p>Select a location and date.</p>";
    return;
  }

  const date = datetime.slice(0, 10);

  try {
    const response = await fetch(
      `https://fsdp-cycling-ltey.onrender.com/events/by-location?location=${location}&date=${date}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

const raw = await response.text();
console.log("RAW RESPONSE:", raw);

try {
  const events = JSON.parse(raw);
  displayCalendar(events, date);
} catch (err) {
  console.error("Response is NOT JSON!");
  return;
}

  } catch (err) {
    console.error("Load calendar error:", err);
  }
}


function displayCalendar(events, date) {
  const box = document.getElementById("calendarContent");
  box.innerHTML = "";

  let html = `<div class="calendar-day">
                <strong>${date}</strong><br><br>`;

  if (events.length === 0) {
    html += `<div class="slot">All time slots available ✔</div>`;
  } else {
    events.forEach(ev => {
      const time = ev.EventDate.slice(11, 16); // HH:mm
      html += `
        <div class="slot unavailable">
          ${time} — Unavailable 
          <br>(${ev.EventName})
        </div>
      `;
    });
  }

  html += `</div>`;
  box.innerHTML = html;
}
