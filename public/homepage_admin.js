const token = localStorage.getItem('token');

//if (!token) {
  // If no token is found, redirect to login page
 // window.location.href = '../index.html';}


const title = document.getElementById("title1")
const title2 = document.getElementById("title2")
const dashboard1 = document.getElementById("dashboard1")
const dashboard2 = document.getElementById("dashboard2")




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
    data.forEach(application => {
        const applicationCard = document.createElement('div');
        applicationCard.className = 'event-card';
        applicationCard.innerHTML = `
            <h3>${application.EventName}</h3>
            <p><strong>Date:</strong> ${application.EventDate}</p>
            <p><strong>Organization:</strong> ${application.OrganizationID}</p>
            <span class="status-tag status-pending">${application.Status}</span>
           
        `;
        applicationCard.addEventListener('click', () => {
        localStorage.setItem('currentRequest', JSON.stringify(application));
        window.location.href = './admin_request.html';
});
        eventGrid1.appendChild(applicationCard);
    });}
    else if (choice === "date") {

        const sortedData = data.sort((a, b) => new Date(a.CreatedAt) - new Date(b.CreatedAt));
        sortedData.forEach(application => {

            const applicationCard = document.createElement('div');
            applicationCard.className = 'event-card';
            applicationCard.innerHTML = `
                <h3>${application.EventName}</h3>
                <p><strong>Date:</strong> ${application.EventDate}</p>
                 <p><strong>Apply on:</strong> ${application.CreatedAt}</p>
                <p><strong>Organization:</strong> ${application.OrganizationID}</p>
                <span class="status-tag status-pending">${application.Status}</span>
            `;
             applicationCard.addEventListener('click', () => {
        localStorage.setItem('currentRequest', JSON.stringify(application));
        window.location.href = './admin_request.html';
});
            eventGrid1.appendChild(applicationCard);
        }
        );
    }
    else if (choice === "approved") {
        data.filter(app => app.Status === "Approved").forEach(application => {
            const applicationCard = document.createElement('div');
            applicationCard.className = 'event-card';
            applicationCard.innerHTML = `
                <h3>${application.EventName}</h3>
                <p><strong>Date:</strong> ${application.EventDate}</p>
                <p><strong>Organization:</strong> ${application.OrganizationID}</p>
                <span class="status-tag status-approved">${application.Status}</span>
            `;
             applicationCard.addEventListener('click', () => {
        localStorage.setItem('currentRequest', JSON.stringify(application));
        window.location.href = './admin_request.html';
});
            eventGrid1.appendChild(applicationCard);
        })}

    else if(choice == "rejected"){
        data.filter(app => app.Status === "Rejected").forEach(application => {
            const applicationCard = document.createElement('div');
            applicationCard.className = 'event-card';
            applicationCard.innerHTML = `
                <h3>${application.EventName}</h3>
                <p><strong>Date:</strong> ${application.EventDate}</p>
                <p><strong>Organization:</strong> ${application.OrganizationID}</p>
                <span class="status-tag status-rejected">${application.Status}</span>
            `;
             applicationCard.addEventListener('click', () => {
        localStorage.setItem('currentRequest', JSON.stringify(application));
        window.location.href = './admin_request.html';
});
            eventGrid1.appendChild(applicationCard);
        } );
      }
      else if (choice ==  'history'){
        data.filter(app => app.Status === "Approved" || app.Status === "Rejected").forEach(application => {
            const applicationCard = document.createElement('div');
            applicationCard.className = 'event-card';
            applicationCard.innerHTML = `
                <h3>${application.EventName}</h3>
                <p><strong>Date:</strong> ${application.EventDate}</p>
                <p><strong>Organization:</strong> ${application.OrganizationID}</p>
                <span class="status-tag status-${application.Status.toLowerCase()}">${application.Status}</span>
            `;
             applicationCard.addEventListener('click', () => {
        localStorage.setItem('currentRequest', JSON.stringify(application));
        window.location.href = './admin_request.html';
});
            eventGrid1.appendChild(applicationCard);
        }
        );
      }

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
        if(choice == "all"){
        data.forEach(event => {
            const eventCard = document.createElement('div');
            eventCard.className = 'event-card';
            eventCard.innerHTML = `
                <h3>${event.EventName}</h3>
                <p><strong>Date:</strong> ${event.EventDate}</p>
                <p><strong>Organization:</strong> ${event.OrganizationID}</p>
                 <p><strong>Date:</strong> ${event.PeopleSignUp || 'No people Sign Up for this event'}</p>
                <span class="status-tag status-pending">${event.Status}</span>

            `;
             eventCard.addEventListener('click', () => {
        localStorage.setItem('currentRequest', JSON.stringify(ev));
        window.location.href = './admin_event.html';
});
            eventGrid2.appendChild(eventCard);
        });}
        else if (choice === "Event date") {
            const sortedData = data.sort((a, b) => new Date(a.EventDate) - new Date(b.EventDate));
            sortedData.forEach(event => {
                const eventCard = document.createElement('div');
                eventCard.className = 'event-card';
                eventCard.innerHTML = `
                      <h3>${event.EventName}</h3>
                <p><strong>Date:</strong> ${event.EventDate}</p>
                <p><strong>Organization:</strong> ${event.OrganizationID}</p>
                 <p><strong>Participant:</strong> ${event.PeopleSignUp || 'No people Sign Up for this event'}</p>
                <span class="status-tag status-pending">${event.Status}</span>
                `;
 eventCard.addEventListener('click', () => {
        localStorage.setItem('currentRequest', JSON.stringify(ev));
        window.location.href = './admin_event.html';
});
                eventGrid2.appendChild(eventCard);
            }
            );
        }
        else if (choice === "Organization") {
            const sortedData = data.sort((a, b) => a.OrganizationID.localeCompare(b.OrganizationID));
            sortedData.forEach(event => {
                const eventCard = document.createElement('div');
                eventCard.className = 'event-card';
                eventCard.innerHTML = `
                      <h3>${event.EventName}</h3>
                <p><strong>Date:</strong> ${event.EventDate}</p>
                <p><strong>Organization:</strong> ${event.OrganizationID}</p>
                 <p><strong>Participant:</strong> ${event.PeopleSignUp || 'No people Sign Up for this event'}</p>
                <span class="status-tag status-pending">${event.Status}</span>
                `;
                 eventCard.addEventListener('click', () => {
        localStorage.setItem('currentRequest', JSON.stringify(ev));
        window.location.href = './admin_event.html';
});
                eventGrid2.appendChild(eventCard);
            } );
        }
        else if (choice ==  'full'){
            data.filter(ev => ev. RequiredVolunteers == ev.PeopleSignUp).forEach(event => {
                const eventCard = document.createElement('div');
                eventCard.className = 'event-card';
                eventCard.innerHTML = `
                      <h3>${event.EventName}</h3>
                <p><strong>Date:</strong> ${event.EventDate}</p>
                <p><strong>Organization:</strong> ${event.OrganizationID}</p>
                 <p><strong>Participant:</strong> ${event.PeopleSignUp || 'No people Sign Up for this event'}</p>
                <span class="status-tag status-pending">${event.Status}</span>
                `;
                 eventCard.addEventListener('click', () => {
        localStorage.setItem('currentRequest', JSON.stringify(ev));
        window.location.href = './admin_event.html';
});
                eventGrid2.appendChild(eventCard);
            } );
          } 
        else if (choice ==  'not full'){
          data.filter(ev => ev.RequiredVolunteers > ev.PeopleSignUp).forEach(event => {
            const eventCard = document.createElement('div');
            eventCard.className = 'event-card';
            eventCard.innerHTML = `
                  <h3>${event.EventName}</h3>
            <p><strong>Date:</strong> ${event.EventDate}</p>
            <p><strong>Organization:</strong> ${event.OrganizationID}</p>
             <p><strong>Participant:</strong> ${event.PeopleSignUp || 'No people Sign Up for this event'}</p>
            <span class="status-tag status-pending">${event.Status}</span>
            `;
             eventCard.addEventListener('click', () => {
        localStorage.setItem('currentRequest', JSON.stringify(ev));
        window.location.href = './admin_event.html';
});
            eventGrid2.appendChild(eventCard);} );
          } 

          else if (choice ==  'history'){
            const currentDate = new Date();
            data.filter(ev => new Date(ev.EventDate) < currentDate).forEach(event => {
                const eventCard = document.createElement('div');
                eventCard.className = 'event-card';
                eventCard.innerHTML = `
                      <h3>${event.EventName}</h3>
                <p><strong>Date:</strong> ${event.EventDate}</p>
                <p><strong>Organization:</strong> ${event.OrganizationID}</p>
                 <p><strong>Participant:</strong> ${event.PeopleSignUp || 'No people Sign Up for this event'}</p>
                <span class="status-tag status-pending">${event.Status}</span>
                `;
                 eventCard.addEventListener('click', () => {
        localStorage.setItem('currentRequest', JSON.stringify(ev));
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
        requestAll2("history");
    }
    );


document.addEventListener("DOMContentLoaded", () => {
 
 requestAll("all");
 requestAll2("all");

 
});




