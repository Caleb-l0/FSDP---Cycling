const token = localStorage.getItem('token');
if (!token) {
    window.location.href = '../../index.html';
}


const title = document.getElementById("title1"); 
const title2 = document.getElementById("title2"); 

const dashboard1 = document.getElementById("dashboard1"); 
const dashboard2 = document.getElementById("dashboard2");
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];


// Initial state: Show dashboard1 (Applications) by default
if (dashboard1) dashboard1.style.display = "block"; 
if (dashboard2) dashboard2.style.display = "none";


title.addEventListener("click", function() {
    // Remove selected from title2
    if (title2) {
        title2.classList.remove("dashboard_title_selected");
        title2.classList.add("dashboard_title_not_selected");
    }
    
    // Add selected to title1
    title.classList.remove("dashboard_title_not_selected");
    title.classList.add("dashboard_title_selected");
    
    // Show dashboard1, hide dashboard2
    if(dashboard1) dashboard1.style.display = "block"; 
    if(dashboard2) dashboard2.style.display = "none";
});


title2.addEventListener("click", function() {
    // Remove selected from title1
    if (title) {
        title.classList.remove("dashboard_title_selected");
        title.classList.add("dashboard_title_not_selected");
    }
    
    // Add selected to title2
    title2.classList.remove("dashboard_title_not_selected");
    title2.classList.add("dashboard_title_selected"); 
    
    // Show dashboard2, hide dashboard1
    if(dashboard1) dashboard1.style.display = "none";
    if(dashboard2) dashboard2.style.display = "block";
});



// ------ DashBoard
const filterGroup1 = document.getElementById("filter-group1");
const filterGroup2 = document.getElementById("filter-group2");



// filter for dashboard 1

const filterButtons1 = filterGroup1.getElementsByClassName("filter-btn");
for (let i = 0; i < filterButtons1.length; i++) {
   
  filterButtons1[i].addEventListener("click", function() {
    // Remove active class from all buttons
    for (let j = 0; j < filterButtons1.length; j++) {
      filterButtons1[j].classList.remove("active");

    }
   
    this.classList.add("active");
  }
    );
}

// filter for dashboard 2
const filterButtons2 = filterGroup2.getElementsByClassName("filter-btn");
for (let i = 0; i < filterButtons2.length; i++) {
  filterButtons2[i].addEventListener("click", function() {
    // Remove active class from all buttons
    for (let j = 0; j < filterButtons2.length; j++) {
      filterButtons2[j].classList.remove("active");
    } 
    this.classList.add("active");
  });
}

const eventGrid1 = document.getElementsByClassName("event-grid")[0];
const eventGrid2 = document.getElementsByClassName("event-grid")[1];

async function GetLocation(eventID){
  try{
    const res = await fetch(`https://fsdp-cycling-ltey.onrender.com/admin/events/location/${eventID}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json', 
        "Authorization": `Bearer ${token}` 
      }
    });

    if (!res.ok) throw new Error('Network response was not ok');

    const result = await res.json(); 
   
    return result.data; // { EventLocation: "Jurong East Hall" }

  } catch(error){
    console.log("error:", error);
  }

}



//----------------------------------------------------------------
// for dashboard 1
// ------------------------------------------------
// Dashboard 1 – Applications
// ------------------------------------------------
async function requestAll(choice) {
  try {
    const res = await fetch(
      "https://fsdp-cycling-ltey.onrender.com/admin/applications",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (!res.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await res.json();
    console.log("Applications:", data);

    eventGrid1.innerHTML = "";

    
    if (choice === "date") {
      data.sort(
        (a, b) => new Date(a.eventdate) - new Date(b.eventdate)
      );
    }
    else if (choice === "organization") {
      data.sort((a, b) => {
      
        if (a.organizationid < b.organizationid) return -1;
        if (a.organizationid > b.organizationid) return 1;
        return 0;
      });
    }


    for (const application of data) {
   
      if (
        (choice === "approved" && application.status !== "Approved") ||
        (choice === "rejected" && application.status !== "Rejected") ||
        (choice === "history" &&
          application.status !== "Approved" &&
          application.status !== "Rejected")
      ) {
        continue;
      }

     
      const locationObj = await GetLocation(
        Number(application.eventid)
      );
      const locationName =
        locationObj?.location || "Unknown";

     
      const eventDate = new Date(application.eventdate);
      const applyDate = new Date(application.createdat);

      const card = document.createElement("div");
      card.className = "event-card";
      card.style.cursor = "pointer";

      card.innerHTML = `
        <h3>${application.eventname}</h3>
        <p><strong>Date:</strong>
          ${eventDate.getDate()} 
          ${months[eventDate.getMonth()]} 
          ${eventDate.getFullYear()}
        </p>
        <p><strong>Location:</strong> ${locationName}</p>
        <p><strong>Applied on:</strong>
          ${applyDate.getDate()} 
          ${months[applyDate.getMonth()]} 
          ${applyDate.getFullYear()}
        </p>
        <p><strong>Organization:</strong> ${application.organizationid}</p>
        <span class="status-tag status-${application.status.toLowerCase()}">
          ${application.status}
        </span>
      `;

   
      card.addEventListener("click", () => {
        localStorage.setItem(
          "currentApplication",
          JSON.stringify(application)
        );
        window.location.href = "./admin_request.html";
      });

      eventGrid1.appendChild(card);
    }
  } catch (err) {
    console.error("Error fetching applications:", err);
  }
}


const requestallbt = document.getElementById("request_all");
const requestdatebt = document.getElementById("request_date");
const requestorganbt = document.getElementById("request_organ");
const requestapprovedbt = document.getElementById("request_approved");
const requestrejectbt = document.getElementById("request_reject");
const requestHistorybt = document.getElementById("request_history");
const requestbyorganisation = document.getElementById("request_organ");

requestallbt.addEventListener("click", () => {
  requestAll("all");
});

requestdatebt.addEventListener("click", () => {
  requestAll("date");
});

requestapprovedbt.addEventListener("click", () => {
  requestAll("approved");
});

requestrejectbt.addEventListener("click", () => {
  requestAll("rejected");
});

requestHistorybt.addEventListener("click", () => {
  requestAll("history");
});

requestorganbt.addEventListener("click", () => {
  requestAll("organization"); 
});









//----------------------------------------------------------------
// for dashboard 2


const all_event = document.getElementById("all_event");
const full_event = document.getElementById("full_event");
const not_full_event = document.getElementById("not_full_event");
const event_date = document.getElementById("event_date");
const event_organization = document.getElementById("event_organization");
const event_history = document.getElementById("event_history");

async function requestAll2(choice) {

    try{
        const res = await fetch('https://fsdp-cycling-ltey.onrender.com/admin/events', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json', 
          "Authorization": `Bearer ${token}` 
        }
      });
        if (!res.ok) {
            throw new Error('Network response was not ok');
        }
        const data =  await res.json();
        console.log(data);

          // --------------------

        if(choice == "all"){
        data.forEach(event => {
          date = new Date(event.eventdate)
            const day =date.getDate(); 
  const month = months[date.getMonth()];
  const year = date.getFullYear();
            const eventCard = document.createElement('div');
            eventCard.className = 'event-card';
            eventCard.style.cursor = 'pointer';
            eventCard.innerHTML = `
                <h3>${event.eventname}</h3>
                <p><strong>Date:</strong> ${day} ${month} ${year}</p>
                
                <p><strong>Organization:</strong> ${event.organizationid}</p>
                

                 <p><strong>Participants:</strong> ${event.participantsignup || 'No people Sign Up for this event'} / ${event.maximumparticipant}</p>
                 <p><strong>Location:</strong> ${event.location}</p>
   
                 

                <span class="status-tag status-pending">${event.status}</span>

            `;
             eventCard.addEventListener('click', () => {
        localStorage.setItem('currentEvent', JSON.stringify(event));
        window.location.href = './admin_event.html';
});
            eventGrid2.appendChild(eventCard);
        });}


          // --------------------

        else if (choice === "Event date") {
           data.sort((a, b) =>  new Date(a.eventdate)-new Date(b.eventdate));
                   data.forEach(event => {
          date = new Date(event.eventdate)
            const day =date.getDate(); 
  const month = months[date.getMonth()];
  const year = date.getFullYear();
            const eventCard = document.createElement('div');
            eventCard.className = 'event-card';
            eventCard.style.cursor = 'pointer';
            eventCard.innerHTML = `
                <h3>${event.eventname}</h3>
                <p><strong>Date:</strong> ${day} ${month} ${year}</p>
                
                <p><strong>Organization:</strong> ${event.organizationid}</p>
                

                   <p><strong>Participants:</strong> ${event.maximumparticipant || 'No people Sign Up for this event'} / ${event.participantsignup}</p>
                 <p><strong>Location:</strong> ${event.location}</p>
                <span class="status-tag status-pending">${event.Status}</span>

            `;
             eventCard.addEventListener('click', () => {
        localStorage.setItem('currentEvent', JSON.stringify(event));
        window.location.href = './admin_event.html';
});
            eventGrid2.appendChild(eventCard);
            }
            );
        }


          // --------------------
        else if (choice === "Organization") {
            const sortedData = data.sort((a, b) => a.organizationid - b.organizationid);
                          sortedData.forEach(event => {
          date = new Date(event.eventdate)
            const day =date.getDate(); 
  const month = months[date.getMonth()];
  const year = date.getFullYear();
            const eventCard = document.createElement('div');
            eventCard.className = 'event-card';
            eventCard.style.cursor = 'pointer';
            eventCard.innerHTML = `
                <h3>${event.eventname}</h3>
                <p><strong>Date:</strong> ${day} ${month} ${year}</p>
                
                <p><strong>Organization:</strong> ${event.organizationid}</p>
                

       <p><strong>Participants:</strong> ${event.maximumparticipant || 'No people Sign Up for this event'} / ${event.participantsignup}</p>
                 <p><strong>Location:</strong> ${event.location}</p>
                <span class="status-tag status-pending">${event.status}</span>

            `;
             eventCard.addEventListener('click', () => {
       localStorage.setItem('currentEvent', JSON.stringify(event));
        window.location.href = './admin_event.html';
});
            eventGrid2.appendChild(eventCard);
            } );
        }


        // --------------------

        else if (choice ==  'full'){
            const newdata = data.filter(data => data.requiredvolunteers === data.peoplesignup)
            newdata.forEach(event => {
          date = new Date(event.eventdate)
            const day =date.getDate(); 
  const month = months[date.getMonth()];
  const year = date.getFullYear();
            const eventCard = document.createElement('div');
            eventCard.className = 'event-card';
            eventCard.style.cursor = 'pointer';
            eventCard.innerHTML = `
                <h3>${event.eventname}</h3>
                <p><strong>Date:</strong> ${day} ${month} ${year}</p>
                
                <p><strong>Organization:</strong> ${event.organizationid}</p>

             <p><strong>Participants:</strong> ${event.maximumparticipant || 'No people Sign Up for this event'} / ${event.participantsignup}</p>
                 <p><strong>Location:</strong> ${event.location}</p>

                <span class="status-tag status-pending">${event.status}</span>

            `;
             eventCard.addEventListener('click', () => {
       localStorage.setItem('currentEvent', JSON.stringify(event));
        window.location.href = './admin_event.html';
});
            eventGrid2.appendChild(eventCard);
        })}



        //---------------------------

         else if (choice ==  'not full'){
            const newdata = data.filter(data => data.requiredvolunteers > data.peoplesignup)
            newdata.forEach(event => {
          date = new Date(event.eventdate)
            const day =date.getDate(); 
  const month = months[date.getMonth()];
  const year = date.getFullYear();
            const eventCard = document.createElement('div');
            eventCard.className = 'event-card';
            eventCard.style.cursor = 'pointer';
            eventCard.innerHTML = `
                <h3>${event.eventname}</h3>
                <p><strong>Date:</strong> ${day} ${month} ${year}</p>
                
                <p><strong>Organization:</strong> ${event.organizationid}</p>

          <p><strong>Participants:</strong> ${event.maximumparticipant || 'No people Sign Up for this event'} / ${event.participantsignup}</p>
                 <p><strong>Location:</strong> ${event.location}</p>

                <span class="status-tag status-pending">${event.status}</span>

            `;
             eventCard.addEventListener('click', () => {
     localStorage.setItem('currentEvent', JSON.stringify(event));
        window.location.href = './admin_event.html';
});
            eventGrid2.appendChild(eventCard);
        })}



        //---------------------------

          else if (choice ==  'outdated'){
            const currentDate = new Date();
         
                const newdata =  data.filter(ev => new Date(ev.eventdate) < currentDate)
            newdata.forEach(event => {
          date = new Date(event.eventdate)
            const day =date.getDate(); 
  const month = months[date.getMonth()];
  const year = date.getFullYear();
            const eventCard = document.createElement('div');
            eventCard.className = 'event-card';
            eventCard.style.cursor = 'pointer';
            eventCard.innerHTML = `
                <h3>${event.eventname}</h3>
                <p><strong>Date:</strong> ${day} ${month} ${year}</p>
                
                <p><strong>Organization:</strong> ${event.organizationid}</p>

                <p><strong>Participants:</strong> ${event.maximumparticipant || 'No people Sign Up for this event'} / ${event.participantsignup}</p>
                 <p><strong>Location:</strong> ${event.location}</p>

                <span class="status-tag status-pending">${event.status}</span>

            `;
             eventCard.addEventListener('click', () => {
       localStorage.setItem('currentEvent', JSON.stringify(event));
        window.location.href = './admin_event.html';
});
            eventGrid2.appendChild(eventCard);
            } );
        
        }
      }
    catch(err){
        console.error("Error fetching events:", err);
    }
    }


    // Event listeners for dashboard 2 buttons
    all_event.addEventListener("click", () => {
        eventGrid2.innerHTML = "";
        requestAll2("all");
    }
    );
    full_event.addEventListener("click", () => {
        eventGrid2.innerHTML = "";
        requestAll2("full");
    }
    );
    not_full_event.addEventListener("click", () => {
        eventGrid2.innerHTML = "";
        requestAll2("not full");
    }
    );
    event_date.addEventListener("click", () => {
       eventGrid2.innerHTML = ``
        requestAll2("Event date");
    }
    );
    event_organization.addEventListener("click", () => {
        eventGrid2.innerHTML = `  
        `;
        requestAll2("Organization");
    }
    );
    event_history.addEventListener("click", () => {
        eventGrid2.innerHTML = `
        `;
        requestAll2("outdate");
    }
    );



    // 
const svcEvents = [
  {
    name: "Morning Yoga",
    location: "Community Hall",
    time: "10:00 AM",
    date: new Date().toISOString().split("T")[0]  // today
  },
  {
    name: "Health Talk",
    location: "Senior Center",
    time: "2:00 PM",
    date: "2025-12-20"
  }
];

let adminEvents = []; 
let svcCurrent = new Date(); 


async function loadAdminEvents() {
  try {
    const res = await fetch("https://fsdp-cycling-ltey.onrender.com/admin/events", {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!res.ok) {
      throw new Error("Failed to fetch events");
    }

    adminEvents = await res.json();
    
    // Only load calendar if grid element exists
    if (document.getElementById("svc-calendarGrid")) {
      svcLoadCalendar();
    }
  } catch (err) {
    console.error("Error loading admin events:", err);
    // Show error in calendar if element exists
    const grid = document.getElementById("svc-calendarGrid");
    if (grid) {
      grid.innerHTML = '<div style="padding: 20px; text-align: center; color: #ef4444;">Failed to load calendar events</div>';
    }
  }
}


function svcLoadCalendar() {
  const grid = document.getElementById("svc-calendarGrid");
  const title = document.getElementById("svc-monthYear");
  
  if (!grid || !title) {
    console.warn("Calendar elements not found");
    return;
  }
  
  grid.innerHTML = "";

  const year = svcCurrent.getFullYear();
  const month = svcCurrent.getMonth();

  title.innerHTML = svcCurrent.toLocaleString("default", { month: "long" }) + " " + year;

  // Weekday labels
  ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].forEach(d => {
    grid.innerHTML += `<div class="svc-day-name">${d}</div>`;
  });

  const firstDay = new Date(year, month, 1).getDay();
  const numDays = new Date(year, month+1, 0).getDate();

  for (let i = 0; i < firstDay; i++) grid.innerHTML += `<div></div>`;

  for (let d = 1; d <= numDays; d++) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

    const dailyEvents = adminEvents.filter(ev => {
      if (!ev.eventdate) return false;
      // Handle both timestamp strings and Date objects
      let eventDateStr;
      if (typeof ev.eventdate === 'string') {
        eventDateStr = ev.eventdate.slice(0, 10);
      } else {
        eventDateStr = new Date(ev.eventdate).toISOString().slice(0, 10);
      }
      return eventDateStr === dateStr;
    });

    let eventHTML = "";
    dailyEvents.forEach(ev => {
      // Extract time from eventdate
      let time = "All Day";
      if (ev.eventdate) {
        if (typeof ev.eventdate === 'string' && ev.eventdate.includes('T')) {
          time = ev.eventdate.slice(11, 16) || "All Day";
        } else if (ev.eventdate instanceof Date || (typeof ev.eventdate === 'string' && ev.eventdate.length > 10)) {
          const dateObj = new Date(ev.eventdate);
          if (!isNaN(dateObj.getTime())) {
            time = dateObj.toTimeString().slice(0, 5);
          }
        }
      }

      eventHTML += `
        <div class="svc-event-box svc-event-click"
          data-event='${JSON.stringify(ev).replace(/'/g, "&apos;")}'>

          <div class="svc-event-title">${ev.eventname || 'Untitled Event'}</div>
          <div>${ev.location || 'Location TBD'}</div>
          <div class="svc-event-time">${time}</div>
        </div>`;
    });

    grid.innerHTML += `
      <div class="svc-day">
        <div>${d}</div>
        ${eventHTML}
      </div>
    `;
  }

  // Add click handlers after a short delay to ensure DOM is ready
  setTimeout(() => {
    document.querySelectorAll(".svc-event-click").forEach(box => {
      box.addEventListener("click", () => {
        try {
          const eventData = box.getAttribute("data-event");
          const eventObj = JSON.parse(eventData.replace(/&apos;/g, "'"));

          // Store event data for the detail page
          localStorage.setItem("currentEvent", JSON.stringify(eventObj));
          
          // Navigate to event detail page
          window.location.href = "./admin_event.html";
        } catch (error) {
          console.error("Error parsing event data:", error);
        }
      });
    });
  }, 100);
}


function svcPrevMonth() {
  svcCurrent.setMonth(svcCurrent.getMonth() - 1);
  svcLoadCalendar();
}

function svcNextMonth() {
  svcCurrent.setMonth(svcCurrent.getMonth() + 1);
  svcLoadCalendar();
}

// Note: Booking requests are the same as applications, so they're handled in dashboard1

// Check In Modal functionality
function initCheckInModal() {
  const checkInLink = document.getElementById("checkin-link");
  const checkInLinkMobile = document.getElementById("checkin-link-mobile");
  const modal = document.getElementById("checkin-modal");
  const closeBtn = document.querySelector(".checkin-modal-close");
  const eventsList = document.getElementById("checkin-events-list");

  function openModal() {
    modal.style.display = "flex";
    loadCheckInEvents();
  }

  function closeModal() {
    modal.style.display = "none";
  }

  if (checkInLink) {
    checkInLink.addEventListener("click", (e) => {
      e.preventDefault();
      openModal();
    });
  }

  if (checkInLinkMobile) {
    checkInLinkMobile.addEventListener("click", (e) => {
      e.preventDefault();
      openModal();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", closeModal);
  }

  // Close modal when clicking outside
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
  }
}

async function loadCheckInEvents() {
  const eventsList = document.getElementById("checkin-events-list");
  
  try {
    eventsList.innerHTML = '<div class="loading">Loading events...</div>';

    const response = await fetch("https://fsdp-cycling-ltey.onrender.com/admin/events", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error("Failed to load events");
    }

    const events = await response.json();

    if (!Array.isArray(events) || events.length === 0) {
      eventsList.innerHTML = '<div class="empty">No events found. Create an event to get started.</div>';
      return;
    }

    // Sort by date (upcoming first, then past events)
    const sortedEvents = [...events].sort((a, b) => {
      const dateA = new Date(a.eventdate);
      const dateB = new Date(b.eventdate);
      return dateA - dateB;
    });

    eventsList.innerHTML = "";
    sortedEvents.forEach(event => {
      const eventItem = document.createElement("div");
      eventItem.className = "checkin-event-item";
      
      const eventDate = new Date(event.eventdate);
      const dateStr = eventDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      // Determine if event is upcoming or past
      const isUpcoming = eventDate > new Date();
      const signupCount = event.peoplesignup || 0;
      const maxParticipants = event.maximumparticipant || "N/A";
      
      // Add visual indicator for events with signups
      const hasSignups = signupCount > 0;
      if (hasSignups) {
        eventItem.style.borderLeft = "4px solid #ea8d2a";
      }
      
      eventItem.innerHTML = `
        <h3>${event.eventname || "Untitled Event"}</h3>
        <p><strong>Date:</strong> ${dateStr}</p>
        <p><strong>Location:</strong> ${event.location || "TBD"}</p>
        <p class="signup-count"><strong>Signups:</strong> ${signupCount} / ${maxParticipants}</p>
        ${!isUpcoming ? '<p style="color: #6b7280; font-size: 0.875rem;"><em>Past Event</em></p>' : ''}
      `;

      eventItem.addEventListener("click", () => {
        // Store event and navigate to event details page
        localStorage.setItem("currentEvent", JSON.stringify(event));
        localStorage.setItem("openCheckInTab", "true");
        window.location.href = "./admin_event.html";
      });

      eventsList.appendChild(eventItem);
    });

  } catch (error) {
    console.error("Error loading check-in events:", error);
    eventsList.innerHTML = '<div class="empty">Error loading events. Please try again.</div>';
  }
}

// Initialize everything on page load
document.addEventListener("DOMContentLoaded", () => {
  // Load initial data for dashboard1 (Applications) - shown by default
  requestAll("all");
  
  // Load initial data for dashboard2 (Events) - but don't display yet
  requestAll2("all");
  
  // Load calendar events
  loadAdminEvents();
  
  // Initialize check-in modal
  initCheckInModal();
});




