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

const eventGrid1 = document.getElementsByClassName("event-grid")[0];
const eventGrid2 = document.getElementsByClassName("event-grid")[1];

async function requestAll() {

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
    data.forEach(application => {
        const applicationCard = document.createElement('div');
        applicationCard.className = 'event-card';
        applicationCard.innerHTML = `
            <h3>${application.applicantName}</h3>
            <p>Organization: ${application.organization}</p>
            <p>Status: ${application.status}</p>
            <p>Submitted on: ${new Date(application.submissionDate).toLocaleDateString()}</p>
        `;
        eventGrid1.appendChild(applicationCard);
    });
}
catch(err){
    console.error("Error fetching applications:", err);
}
}



document.addEventListener("DOMContentLoaded", () => {
 requestAll();
 
});







