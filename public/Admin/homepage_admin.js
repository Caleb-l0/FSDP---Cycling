const token = localStorage.getItem('token');
if (!token) {

 window.location.href = '../index.html';}


const title = document.getElementById("title1")
const title2 = document.getElementById("title2")
const dashboard1 = document.getElementById("dashboard1")
const dashboard2 = document.getElementById("dashboard2")
const createEventbt = document.getElementById('createEvent')

 const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];






title.addEventListener("click", function() {
  if (title2.classList.contains("dashboard_title_selected")) {
    title2.classList.remove("dashboard_title_selected");
    title2.classList.add("dashboard_title_not_selected");

    title.classList.remove("dashboard_title_not_selected");
    title.classList.add("dashboard_title_selected");
   
    dashboard2.style.display = "none";
    dashboard1.style.display = "block";
 
  } 
 
});



title2.addEventListener("click", function() {
    if (title.classList.contains("dashboard_title_selected")) {
        title.classList.remove("dashboard_title_selected");
        title.classList.add("dashboard_title_not_selected");
        title2.classList.remove("dashboard_title_not_selected");
        title2.classList.add("dashboard_title_selected"); 
        
        
        dashboard1.style.display = "none";
        dashboard2.style.display = "block";



 
  } 

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
    const res = await fetch(`http://localhost:3000/admin/events/location/${eventID}`, {
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
async function requestAll(choice) {

try{
    const res = await fetch('http://localhost:3000/admin/applications', {
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

    if(choice == "all"){
   for (const application of data) {
   
  const locationObj = await GetLocation(parseInt(application.EventID));
  const locationName = locationObj.EventLocation;

  const date = new Date(application.EventDate);
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
      
        const date2 = new Date(application.CreatedAt);
         const day2 = date2.getDate();
           const month2 = months[date2.getMonth()];
           const year2 = date2.getFullYear();

  const card = document.createElement("div");
  card.className = "event-card";

  card.innerHTML = `
    <h3>${application.EventName}</h3>
    <p><strong>Date:</strong> ${day} ${month} ${year}</p>
    <p><strong>Location:</strong> ${locationName}</p>
    <p><strong>Apply on:</strong> ${day2} ${month2} ${year2}</p>
    <p><strong>Organization:</strong> ${application.OrganizationID}</p>
    <span class="status-tag status-${application.Status.toLowerCase()}">${application.Status}</span>
  `;

  card.addEventListener("click", () => {
    localStorage.setItem("currentRequest", JSON.stringify(application));
    window.location.href = "./admin_request.html";
  });

  eventGrid1.appendChild(card);
}}
    else if (choice === "date") {
      data.sort((a, b) =>   new Date(a.EventDate)-new Date(b.EventDate));
        for (const application of data) {

   
  const locationObj = await GetLocation(parseInt(application.EventID));
  const locationName = locationObj.EventLocation;

  const date = new Date(application.EventDate);
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
      
        const date2 = new Date(application.CreatedAt);
         const day2 = date2.getDate();
           const month2 = months[date2.getMonth()];
           const year2 = date2.getFullYear();

  const card = document.createElement("div");
  card.className = "event-card";

  card.innerHTML = `
    <h3>${application.EventName}</h3>
    <p><strong>Date:</strong> ${day} ${month} ${year}</p>
    <p><strong>Location:</strong> ${locationName}</p>
    <p><strong>Apply on:</strong> ${day2} ${month2} ${year2}</p>
    <p><strong>Organization:</strong> ${application.OrganizationID}</p>
    <span class="status-tag status-${application.Status.toLowerCase()}">${application.Status}</span>
  `;

  card.addEventListener("click", () => {
    localStorage.setItem("currentRequest", JSON.stringify(application));
    window.location.href = "./admin_request.html";
  });

  eventGrid1.appendChild(card);}
    }
    else if (choice === "approved") {
       for (const application of data) {
        if(application.Status="Approved"){
   
  const locationObj = await GetLocation(parseInt(application.EventID));
  const locationName = locationObj.EventLocation;

  const date = new Date(application.EventDate);
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
      
        const date2 = new Date(application.CreatedAt);
         const day2 = date2.getDate();
           const month2 = months[date2.getMonth()];
           const year2 = date2.getFullYear();

  const card = document.createElement("div");
  card.className = "event-card";

  card.innerHTML = `
    <h3>${application.EventName}</h3>
    <p><strong>Date:</strong> ${day} ${month} ${year}</p>
    <p><strong>Location:</strong> ${locationName}</p>
    <p><strong>Apply on:</strong> ${day2} ${month2} ${year2}</p>
    <p><strong>Organization:</strong> ${application.OrganizationID}</p>
    <span class="status-tag status-${application.Status.toLowerCase()}">${application.Status}</span>
  `;

  card.addEventListener("click", () => {
    localStorage.setItem("currentRequest", JSON.stringify(application));
    window.location.href = "./admin_request.html";
  });

  eventGrid1.appendChild(card);}}}

    else if(choice == "rejected"){
       for (const application of data) {
        if(application.Status = "Rejected"){
   
  const locationObj = await GetLocation(parseInt(application.EventID));
  const locationName = locationObj.EventLocation;

  const date = new Date(application.EventDate);
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
      
        const date2 = new Date(application.CreatedAt);
         const day2 = date2.getDate();
           const month2 = months[date2.getMonth()];
           const year2 = date2.getFullYear();

  const card = document.createElement("div");
  card.className = "event-card";

  card.innerHTML = `
    <h3>${application.EventName}</h3>
    <p><strong>Date:</strong> ${day} ${month} ${year}</p>
    <p><strong>Location:</strong> ${locationName}</p>
    <p><strong>Apply on:</strong> ${day2} ${month2} ${year2}</p>
    <p><strong>Organization:</strong> ${application.OrganizationID}</p>
    <span class="status-tag status-${application.Status.toLowerCase()}">${application.Status}</span>
  `;

  card.addEventListener("click", () => {
    localStorage.setItem("currentRequest", JSON.stringify(application));
    window.location.href = "./admin_request.html";
  });

  eventGrid1.appendChild(card);}
       }}
      else if (choice ==  'history'){
       for (const application of data) {
        if(application.Status === "Approved" || application.Status === "Rejected"){
   
  const locationObj = await GetLocation(parseInt(application.EventID));
  const locationName = locationObj.EventLocation;

  const date = new Date(application.EventDate);
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
      
        const date2 = new Date(application.CreatedAt);
         const day2 = date2.getDate();
           const month2 = months[date2.getMonth()];
           const year2 = date2.getFullYear();

  const card = document.createElement("div");
  card.className = "event-card";

  card.innerHTML = `
    <h3>${application.EventName}</h3>
    <p><strong>Date:</strong> ${day} ${month} ${year}</p>
    <p><strong>Location:</strong> ${locationName}</p>
    <p><strong>Apply on:</strong> ${day2} ${month2} ${year2}</p>
    <p><strong>Organization:</strong> ${application.OrganizationID}</p>
    <span class="status-tag status-${application.Status.toLowerCase()}">${application.Status}</span>
  `;

  card.addEventListener("click", () => {
    localStorage.setItem("currentRequest", JSON.stringify(application));
    window.location.href = "./admin_request.html";
  });

  eventGrid1.appendChild(card);
}}}
}
catch(err){
    console.error("Error fetching applications:", err);
}
}

const requestallbt = document.getElementById("request_all");
const requestdatebt = document.getElementById("request_date");
const requestorganbt = document.getElementById("request_organ");
const requestapprovedbt = document.getElementById("request_approved");
const requestrejectbt = document.getElementById("request_reject");
const requestHistorybt = document.getElementById("request_history");

requestallbt.addEventListener("click", () => {
    eventGrid1.innerHTML = "";
    requestAll("all");
}
);

requestapprovedbt.addEventListener("click", () => {
    eventGrid1.innerHTML = "";
    requestAll("approved");
}); 
requestrejectbt.addEventListener("click", () => {
    eventGrid1.innerHTML = "";
    requestAll("rejected");
});
requestdatebt.addEventListener("click", () => {
   eventGrid1.innerHTML = ``
    requestAll("date");
}
);
requestHistorybt.addEventListener("click", () => {
    eventGrid1.innerHTML = `
  
   
   `;
    requestAll("history");
}
);








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
        const res = await fetch('http://localhost:3000/admin/events', {
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
          date = new Date(event.EventDate)
            const day =date.getDate(); 
  const month = months[date.getMonth()];
  const year = date.getFullYear();
            const eventCard = document.createElement('div');
            eventCard.className = 'event-card';
            eventCard.innerHTML = `
                <h3>${event.EventName}</h3>
                <p><strong>Date:</strong> ${day} ${month} ${year}</p>
                
                <p><strong>Organization:</strong> ${event.OrganizationID}</p>
                

                 <p><strong>Participants:</strong> ${event.PeopleSignUp || 'No people Sign Up for this event'} / ${event.MaximumParticipant}</p>
                 <p><strong>Location:</strong> ${event.Location}</p>

   
                 

                <span class="status-tag status-pending">${event.Status}</span>

            `;
             eventCard.addEventListener('click', () => {
        localStorage.setItem('currentRequest', JSON.stringify(event));
        window.location.href = './admin_event.html';
});
            eventGrid2.appendChild(eventCard);
        });}


          // --------------------

        else if (choice === "Event date") {
           data.sort((a, b) =>  new Date(a.EventDate)-new Date(b.EventDate));
                   data.forEach(event => {
          date = new Date(event.EventDate)
            const day =date.getDate(); 
  const month = months[date.getMonth()];
  const year = date.getFullYear();
            const eventCard = document.createElement('div');
            eventCard.className = 'event-card';
            eventCard.innerHTML = `
                <h3>${event.EventName}</h3>
                <p><strong>Date:</strong> ${day} ${month} ${year}</p>
                
                <p><strong>Organization:</strong> ${event.OrganizationID}</p>
                

                 <p><strong>Participants:</strong> ${event.PeopleSignUp || 'No people Sign Up for this event'} / ${event.MaximumParticipant} </p>
                 <p><strong>Location:</strong> ${event.Location}</p>

                <span class="status-tag status-pending">${event.Status}</span>

            `;
             eventCard.addEventListener('click', () => {
        localStorage.setItem('currentRequest', JSON.stringify(event));
        window.location.href = './admin_event.html';
});
            eventGrid2.appendChild(eventCard);
            }
            );
        }


          // --------------------
        else if (choice === "Organization") {
            const sortedData = data.sort((a, b) => a.OrganizationID - b.OrganizationID);
                          sortedData.forEach(event => {
          date = new Date(event.EventDate)
            const day =date.getDate(); 
  const month = months[date.getMonth()];
  const year = date.getFullYear();
            const eventCard = document.createElement('div');
            eventCard.className = 'event-card';
            eventCard.innerHTML = `
                <h3>${event.EventName}</h3>
                <p><strong>Date:</strong> ${day} ${month} ${year}</p>
                
                <p><strong>Organization:</strong> ${event.OrganizationID}</p>
                

                 <p><strong>Participants:</strong> ${event.PeopleSignUp || 'No people Sign Up for this event'} / ${event.MaximumParticipant}</p>
                 <p><strong>Location:</strong> ${event.Location}</p>

                <span class="status-tag status-pending">${event.Status}</span>

            `;
             eventCard.addEventListener('click', () => {
        localStorage.setItem('currentRequest', JSON.stringify(event));
        window.location.href = './admin_event.html';
});
            eventGrid2.appendChild(eventCard);
            } );
        }


        // --------------------

        else if (choice ==  'full'){
            const newdata = data.filter(data => data. RequiredVolunteers === data.PeopleSignUp)
            newdata.forEach(event => {
          date = new Date(event.EventDate)
            const day =date.getDate(); 
  const month = months[date.getMonth()];
  const year = date.getFullYear();
            const eventCard = document.createElement('div');
            eventCard.className = 'event-card';
            eventCard.innerHTML = `
                <h3>${event.EventName}</h3>
                <p><strong>Date:</strong> ${day} ${month} ${year}</p>
                
                <p><strong>Organization:</strong> ${event.OrganizationID}</p>

                 <p><strong>Participants:</strong> ${event.PeopleSignUp || 'No people Sign Up for this event'}/ ${event.MaximumParticipant} </p>
                 <p><strong>Location:</strong> ${event.Location}</p>

                <span class="status-tag status-pending">${event.Status}</span>

            `;
             eventCard.addEventListener('click', () => {
        localStorage.setItem('currentRequest', JSON.stringify(event));
        window.location.href = './admin_event.html';
});
            eventGrid2.appendChild(eventCard);
        })}



        //---------------------------

         else if (choice ==  'not full'){
            const newdata = data.filter(data => data. RequiredVolunteers > data.PeopleSignUp)
            newdata.forEach(event => {
          date = new Date(event.EventDate)
            const day =date.getDate(); 
  const month = months[date.getMonth()];
  const year = date.getFullYear();
            const eventCard = document.createElement('div');
            eventCard.className = 'event-card';
            eventCard.innerHTML = `
                <h3>${event.EventName}</h3>
                <p><strong>Date:</strong> ${day} ${month} ${year}</p>
                
                <p><strong>Organization:</strong> ${event.OrganizationID}</p>

                 <p><strong>Participants:</strong> ${event.PeopleSignUp || 'No people Sign Up for this event'}/ ${event.MaximumParticipant}</p>
                 <p><strong>Location:</strong> ${event.Location}</p>

                <span class="status-tag status-pending">${event.Status}</span>

            `;
             eventCard.addEventListener('click', () => {
        localStorage.setItem('currentRequest', JSON.stringify(event));
        window.location.href = './admin_event.html';
});
            eventGrid2.appendChild(eventCard);
        })}



        //---------------------------

          else if (choice ==  'outdated'){
            const currentDate = new Date();
         
                const newdata =  data.filter(ev => new Date(ev.EventDate) < currentDate)
            newdata.forEach(event => {
          date = new Date(event.EventDate)
            const day =date.getDate(); 
  const month = months[date.getMonth()];
  const year = date.getFullYear();
            const eventCard = document.createElement('div');
            eventCard.className = 'event-card';
            eventCard.innerHTML = `
                <h3>${event.EventName}</h3>
                <p><strong>Date:</strong> ${day} ${month} ${year}</p>
                
                <p><strong>Organization:</strong> ${event.OrganizationID}</p>

                 <p><strong>Participants:</strong> ${event.PeopleSignUp || 'No people Sign Up for this event'}/ ${event.MaximumParticipant}</p>
                 <p><strong>Location:</strong> ${event.Location}</p>

                <span class="status-tag status-pending">${event.Status}</span>

            `;
             eventCard.addEventListener('click', () => {
        localStorage.setItem('currentRequest', JSON.stringify(event));
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
    const res = await fetch("http://localhost:3000/admin/events", {
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
      ev.EventDate.slice(0, 10) === dateStr
    );

    let eventHTML = "";
    dailyEvents.forEach(ev => {
      const time = ev.EventDate.slice(11, 16);

      eventHTML += `
        <div class="svc-event-box svc-event-click"
          data-event='${JSON.stringify(ev).replace(/'/g, "&apos;")}'>

          <div class="svc-event-title">${ev.EventName}</div>
          <div>${ev.Location}</div>
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



    //
document.addEventListener("DOMContentLoaded", () => {
 
 requestAll("all");
 requestAll2("all");

 
});




