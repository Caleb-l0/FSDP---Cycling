const token = localStorage.getItem('token');
if (!token) {
    window.location.href = '../../index.html';
}


const title = document.getElementById("title1"); 
const title2 = document.getElementById("title2"); 


const dashboard1 = document.getElementById("dashboard1"); 
const dashboard2 = document.getElementById("dashboard2"); 
const dashboard3 = document.getElementById("dashboard3"); 

const bookingGrid = document.getElementById("bookingGrid");
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];


if (dashboard1) dashboard1.style.display = "none"; 
if (dashboard3) {
    dashboard3.style.display = "block";
    loadBookingRequests();
}
if (dashboard2) dashboard2.style.display = "none";


title.addEventListener("click", function() {
    
    if (title2.classList.contains("dashboard_title_selected")) {
        
        
        title2.classList.remove("dashboard_title_selected");
        title2.classList.add("dashboard_title_not_selected");

        title.classList.remove("dashboard_title_not_selected");
        title.classList.add("dashboard_title_selected");
        
        
        dashboard2.style.display = "none";
        if(dashboard1) dashboard1.style.display = "none"; 
        
        if (dashboard3) {
            dashboard3.style.display = "block"; 
            loadBookingRequests(); 
        }
    } 
});


title2.addEventListener("click", function() {
    
    if (title.classList.contains("dashboard_title_selected")) {
        
       
        title.classList.remove("dashboard_title_selected");
        title.classList.add("dashboard_title_not_selected");

        title2.classList.remove("dashboard_title_not_selected");
        title2.classList.add("dashboard_title_selected"); 
        
        
        if(dashboard1) dashboard1.style.display = "none";
        if(dashboard3) dashboard3.style.display = "none"; 
        
        dashboard2.style.display = "block";
    }
});

if (title3) {
  title3.addEventListener("click", function() {
      if (title.classList.contains("dashboard_title_selected") || title2.classList.contains("dashboard_title_selected")) {
          title.classList.remove("dashboard_title_selected");
          title.classList.add("dashboard_title_not_selected");
          title2.classList.remove("dashboard_title_selected");
          title2.classList.add("dashboard_title_not_selected");
          title3.classList.remove("dashboard_title_not_selected");
          title3.classList.add("dashboard_title_selected"); 
          
          dashboard1.style.display = "none";
          dashboard2.style.display = "none";
          if (dashboard3) {
            dashboard3.style.display = "block";
            loadBookingRequests();
          }
      }
  });
}


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
        locationObj?.eventlocation || "Unknown";

     
      const eventDate = new Date(application.eventdate);
      const applyDate = new Date(application.createdat);

      const card = document.createElement("div");
      card.className = "event-card";

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
            eventCard.innerHTML = `
                <h3>${event.eventname}</h3>
                <p><strong>Date:</strong> ${day} ${month} ${year}</p>
                
                <p><strong>Organization:</strong> ${event.organizationid}</p>
                

                 <p><strong>Participants:</strong> ${event.peoplesignup || 'No people Sign Up for this event'} / ${event.maximumparticipant}</p>
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
            eventCard.innerHTML = `
                <h3>${event.eventname}</h3>
                <p><strong>Date:</strong> ${day} ${month} ${year}</p>
                
                <p><strong>Organization:</strong> ${event.organizationid}</p>
                

                 <p><strong>Participants:</strong> ${event.peoplesignup || 'No people Sign Up for this event'} / ${event.maximumparticipant} </p>
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
            eventCard.innerHTML = `
                <h3>${event.eventname}</h3>
                <p><strong>Date:</strong> ${day} ${month} ${year}</p>
                
                <p><strong>Organization:</strong> ${event.organizationid}</p>
                

                 <p><strong>Participants:</strong> ${event.peoplesignup || 'No people Sign Up for this event'} / ${event.maximumparticipant}</p>
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
            eventCard.innerHTML = `
                <h3>${event.eventname}</h3>
                <p><strong>Date:</strong> ${day} ${month} ${year}</p>
                
                <p><strong>Organization:</strong> ${event.organizationid}</p>

                 <p><strong>Participants:</strong> ${event.peoplesignup || 'No people Sign Up for this event'}/ ${event.maximumparticipant} </p>
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
            eventCard.innerHTML = `
                <h3>${event.eventname}</h3>
                <p><strong>Date:</strong> ${day} ${month} ${year}</p>
                
                <p><strong>Organization:</strong> ${event.organizationid}</p>

                 <p><strong>Participants:</strong> ${event.peoplesignup || 'No people Sign Up for this event'}/ ${event.maximumparticipant}</p>
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
            eventCard.innerHTML = `
                <h3>${event.eventname}</h3>
                <p><strong>Date:</strong> ${day} ${month} ${year}</p>
                
                <p><strong>Organization:</strong> ${event.organizationid}</p>

                 <p><strong>Participants:</strong> ${event.peoplesignup || 'No people Sign Up for this event'}/ ${event.maximumparticipant}</p>
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

    adminEvents = await res.json();
    svcLoadCalendar();
  } catch (err) {
    console.error("Error loading admin events:", err);
  }
}


function svcLoadCalendar() {
  const grid = document.getElementById("svc-calendarGrid");
  const title = document.getElementById("svc-monthYear");
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

    const dailyEvents = adminEvents.filter(ev =>
      
 ev.eventdate.slice(0, 10) === dateStr
      
    );

    let eventHTML = "";
    dailyEvents.forEach(ev => {
      const time = ev.eventdate.slice(11, 16);

      eventHTML += `
        <div class="svc-event-box svc-event-click"
          data-event='${JSON.stringify(ev).replace(/'/g, "&apos;")}'>

          <div class="svc-event-title">${ev.eventname}</div>
          <div>${ev.location}</div>
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

  document.querySelectorAll(".svc-event-click").forEach(box => {
    box.addEventListener("click", () => {
      const eventObj = JSON.parse(box.dataset.event);

      localStorage.setItem("currentRequest", JSON.stringify(eventObj));

     
      window.location.href = "./admin_event.html";
    });
  });
}


function svcPrevMonth() {
  svcCurrent.setMonth(svcCurrent.getMonth() - 1);
  svcLoadCalendar();
}

function svcNextMonth() {
  svcCurrent.setMonth(svcCurrent.getMonth() + 1);
  svcLoadCalendar();
}


loadAdminEvents();

// ============================================
// Booking Requests Management
// ============================================
async function loadBookingRequests(filter = "all") {
  try {
    const res = await fetch("https://fsdp-cycling-ltey.onrender.com/organization/events/requests", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (!res.ok) {
      throw new Error("Failed to fetch booking requests");
    }

    const requests = await res.json();
    renderBookingRequests(requests, filter);
  } catch (error) {
    console.error("Error loading booking requests:", error);
    bookingGrid.innerHTML = '<div class="event-message event-message--error">Failed to load booking requests</div>';
  }
}

function renderBookingRequests(requests, filter = "all") {
  bookingGrid.innerHTML = "";

  if (!Array.isArray(requests) || requests.length === 0) {
    bookingGrid.innerHTML = '<div class="event-message event-message--empty">No booking requests found</div>';
    return;
  }

  // Filter requests
  let filteredRequests = requests;
  if (filter === "pending") {
    filteredRequests = requests.filter(r => r.status === "Pending");
  } else if (filter === "approved") {
    filteredRequests = requests.filter(r => r.status === "Approved");
  } else if (filter === "rejected") {
    filteredRequests = requests.filter(r => r.status === "Rejected");
  }

  filteredRequests.forEach(request => {
    const card = document.createElement("div");
    card.className = "event-card";
    
    const eventName = request.eventname || request.EventName || "Unknown Event";
    const orgName = request.orgname || "Unknown Organization";
    const date = request.eventdate ? new Date(request.eventdate).toLocaleDateString() : "TBD";
    const location = request.location || "TBD";
    const status = request.status || "Pending";
    const participants = request.participants || 0;
    const sessionHead = request.session_head_name || "Not specified";
    const sessionContact = request.session_head_contact || "Not specified";
    const sessionEmail = request.session_head_email || "Not specified";

    let statusClass = "status-pending";
    if (status === "Approved") statusClass = "status-approved";
    if (status === "Rejected") statusClass = "status-rejected";

    card.innerHTML = `
      <div class="event-details">
        <h3>${eventName}</h3>
        <p><strong>Organization:</strong> ${orgName}</p>
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>Location:</strong> ${location}</p>
        <p><strong>Participants:</strong> ${participants}</p>
        <p><strong>Session Head:</strong> ${sessionHead}</p>
        <p><strong>Contact:</strong> ${sessionContact}</p>
        <p><strong>Email:</strong> ${sessionEmail}</p>
        <span class="status-tag ${statusClass}">${status}</span>
      </div>
      <div class="event-actions">
        ${status === "Pending" ? `
          <button class="btn-approve" onclick="approveBooking(${request.bookingid})">Approve</button>
          <button class="btn-reject" onclick="rejectBooking(${request.bookingid})">Reject</button>
        ` : ''}
        <button class="btn-view" onclick="viewBookingDetails(${request.bookingid})">View Details</button>
      </div>
    `;

    bookingGrid.appendChild(card);
  });
}

async function approveBooking(bookingId) {
  if (!confirm("Are you sure you want to approve this booking request? This will automatically post to the community board.")) {
    return;
  }

  try {
    const res = await fetch(`https://fsdp-cycling-ltey.onrender.com/organization/events/requests/${bookingId}/approve`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ postToCommunity: true })
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to approve booking");
    }

    alert("✅ Booking request approved successfully!");
    loadBookingRequests();
  } catch (error) {
    console.error("Error approving booking:", error);
    alert("❌ Error: " + error.message);
  }
}

async function rejectBooking(bookingId) {
  if (!confirm("Are you sure you want to reject this booking request?")) {
    return;
  }

  try {
    const res = await fetch(`https://fsdp-cycling-ltey.onrender.com/organization/events/requests/${bookingId}/reject`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to reject booking");
    }

    alert("✅ Booking request rejected");
    loadBookingRequests();
  } catch (error) {
    console.error("Error rejecting booking:", error);
    alert("❌ Error: " + error.message);
  }
}

function viewBookingDetails(bookingId) {
  // Store booking ID and navigate to detail page (or show modal)
  localStorage.setItem("currentBookingId", bookingId);
  // For now, just show an alert with the booking ID
  alert(`Booking ID: ${bookingId}\n\nView full details functionality can be added here.`);
}

// Filter buttons for booking requests
document.addEventListener("DOMContentLoaded", () => {
  const bookingAll = document.getElementById("booking_all");
  const bookingPending = document.getElementById("booking_pending");
  const bookingApproved = document.getElementById("booking_approved");
  const bookingRejected = document.getElementById("booking_rejected");

  if (bookingAll) bookingAll.addEventListener("click", () => loadBookingRequests("all"));
  if (bookingPending) bookingPending.addEventListener("click", () => loadBookingRequests("pending"));
  if (bookingApproved) bookingApproved.addEventListener("click", () => loadBookingRequests("approved"));
  if (bookingRejected) bookingRejected.addEventListener("click", () => loadBookingRequests("rejected"));
});



    //
document.addEventListener("DOMContentLoaded", () => {
 
 requestAll("all");
 requestAll2("all");

 
});




