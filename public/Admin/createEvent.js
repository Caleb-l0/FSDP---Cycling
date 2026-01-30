token = localStorage.getItem('token');

if (!token) {
  // Redirect to login page if not authenticated
  window.location.href = 'login.html';
}

currentRequest = JSON.parse(localStorage.getItem('currentRequest'));



window.addEventListener("DOMContentLoaded", () => {
  if (!currentRequest) return;
  document.getElementById("eventName").value = currentRequest.eventname || "";

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

  const eventImageBase64 = window._eventImageBase64 || null;

  const eventData = {
    EventName: eventName,
    EventDate: eventDate,
    Description: document.getElementById("description").value.trim(),
    RequiredVolunteers: parsedVolunteers,
    Status: document.getElementById("status").value,
    MaximumParticipant:   MaximumParticipant,
    OrganizationID: organizerValue,
    Location: Location,
    EventImage: eventImageBase64,
  };





  try {
    // Check for conflicts BEFORE creating the event
    const conflict = await checkConflict(Location, eventDate);
    
    if (conflict) {
      alert("This time slot is unavailable for the selected location.");
      return;
    }

    const response = await fetch("https://fsdp-cycling-ltey.onrender.com/admin/create_events", {
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
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || 'Failed to create event');
    }

    const result = await response.json();
    console.log(result);

    showCongrats('Event created successfully! Emails are being sent.');
    setTimeout(() => {
      window.location.href = './homepage_login_Admin.html';
    }, 1600);

  } catch (error) {
    console.error("Error creating event:", error);
    alert(`Failed to create event: ${error.message}`);
  }
}

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
  }, 2200);
}

document.getElementById("eventForm").addEventListener("submit", function(e) {
  e.preventDefault(); 
  createEvent();      
});

// ======================================================
// Event Picture Upload
// ======================================================
const eventImageUpload = document.getElementById("eventImageUpload");
const eventImagePreview = document.getElementById("eventImagePreview");
const eventImagePlaceholder = document.getElementById("eventImagePlaceholder");

if (eventImageUpload && eventImagePreview && eventImagePlaceholder) {
  eventImageUpload.addEventListener("change", function(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file (JPG, PNG, etc.).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB. Please select a smaller image.");
      return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
      let base64Image = event.target.result;
      const img = new Image();
      img.onload = function() {
        const canvas = document.createElement("canvas");
        const maxSize = 600;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        base64Image = canvas.toDataURL("image/jpeg", 0.8);
        window._eventImageBase64 = base64Image;
        eventImagePreview.src = base64Image;
        eventImagePreview.style.display = "block";
        eventImagePlaceholder.style.display = "none";
      };
      img.onerror = function() {
        alert("Failed to load image. Please select another image.");
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
}






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
  try {
    if (!location || !datetime) {
      console.warn("checkConflict: Missing location or datetime");
      return false; // No conflict if data is missing
    }

    const date = datetime.slice(0, 10);
    const time = datetime.slice(11, 16);

    if (!time || time.length !== 5) {
      console.warn("checkConflict: Invalid time format");
      return false;
    }

    const response = await fetch(
      `https://fsdp-cycling-ltey.onrender.com/events/by-location?location=${encodeURIComponent(location)}&date=${date}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    if (!response.ok) {
      console.error("checkConflict error status:", response.status);
      // If we can't check, assume no conflict to allow creation
      return false;
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("checkConflict: Non-JSON response:", text.substring(0, 200));
      return false; // Assume no conflict if we can't parse
    }

    const events = await response.json();
    
    if (!Array.isArray(events) || events.length === 0) {
      return false; // No events = no conflict
    }

    // Check if any existing event has the same time
    return events.some(ev => {
      try {
        // Handle both lowercase (PostgreSQL) and uppercase (legacy) field names
        const eventDate = ev.eventdate || ev.EventDate;
        if (!eventDate) return false;

        let evDateStr;
        if (typeof eventDate === 'string') {
          evDateStr = eventDate;
        } else {
          evDateStr = new Date(eventDate).toISOString();
        }

        // Extract time portion (HH:mm)
        const evTime = evDateStr.slice(11, 16);
        
        // Compare times exactly
        return evTime === time;
      } catch (err) {
        console.error("Error comparing event time:", err);
        return false;
      }
    });
  } catch (error) {
    console.error("checkConflict error:", error);
    // On error, assume no conflict to allow creation
    return false;
  }
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
      // Handle both lowercase (PostgreSQL) and uppercase (legacy) field names
      const eventDate = ev.eventdate || ev.EventDate;
      const eventName = ev.eventname || ev.EventName;
      const time = eventDate.slice(11, 16); // HH:mm
      html += `
        <div class="slot unavailable">
          ${time} — Unavailable 
          <br>(${eventName})
        </div>
      `;
    });
  }

  html += `</div>`;
  box.innerHTML = html;
}
