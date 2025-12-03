const token = localStorage.getItem("token");

if (!token) {
    alert("Please log in first");
    window.location.href = "/index.html";   
}
// Function to handle volunteer form submission
function handleVolunteerFormSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    // Process form data (e.g., send to server or display a message)
    console.log("Volunteer Form Submitted:", Object.fromEntries(formData.entries()));
    alert("Thank you for signing up as a volunteer!");
}
// Attach event listener to the volunteer form
document.addEventListener("DOMContentLoaded", function() {
    const volunteerForm = document.getElementById("volunteer-form");
    if (volunteerForm) {
        volunteerForm.addEventListener("submit", handleVolunteerFormSubmit);
    }
});
// Additional volunteer-related functions can be added here
// For example, functions to fetch volunteer opportunities, update volunteer profiles, etc.
// Function to fetch volunteer opportunities (example)
function fetchVolunteerOpportunities() {
    // Simulate fetching data from a server
    const opportunities = [
        { title: "Community Clean-Up", date: "2024-07-15" },
        { title: "Food Drive Assistance", date: "2024-08-01" },
    ];
    console.log("Volunteer Opportunities:", opportunities);
    return opportunities;
}
// Call the function to fetch opportunities on page load
document.addEventListener("DOMContentLoaded", function() {
    fetchVolunteerOpportunities();
});





document.addEventListener("DOMContentLoaded", () => {
    loadHomepageEvents();
});

async function loadHomepageEvents() {
    const container = document.querySelector(".scrollable");
    if (!container) return;

     const res = await fetch("https://fsdp-cycling-ltey.onrender.com/volunteer/events", {
        headers: { "Authorization": `Bearer ${token}` }
    });

    const events = await res.json();

    container.innerHTML = "";

    events.forEach(e => {
        container.innerHTML += `
            <div class="event-box">
                <div class="service-card event-item"
                    onclick="goToEventDetail(${e.EventID})">

                    <div class="service-icon"><i class="fas fa-calendar"></i></div>

                    <div class="service-content">
                        <h3>${e.EventName}</h3>
                        <p>${new Date(e.EventDate).toLocaleDateString()}</p>
                        <p>${e.Location}</p>
                    </div>
                </div>
            </div>
        `;
    });
}

function goToEventDetail(id) {
    window.location.href = `./volunteer_event_detail.html?eventId=${id}`;
}


document.addEventListener("DOMContentLoaded", () => {
    loadVolunteersHomepage();
});

async function loadVolunteersHomepage() {
    const container = document.querySelector("#homepage-volunteers");
    if (!container) return;

    const token = localStorage.getItem("token");

    try {
        const res = await fetch("https://fsdp-cycling-ltey.onrender.com/community/browse/volunteers", {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });

        const volunteers = await res.json();

        container.innerHTML = "";

        volunteers.forEach(v => {
            container.innerHTML += `
                <div class="event-box">
                    <div class="service-card volunteer-card"
                         onclick="openVolunteerProfile('${v.id}')">

                        <div class="service-icon">
                            <i class="fas fa-user"></i>
                        </div>

                        <div class="service-content">
                            <h3>${v.name}</h3>
                            <p>Active Volunteer</p>
                        </div>

                    </div>
                </div>
            `;
        });

    } catch (err) {
        console.error("Failed to load volunteers:", err);
    }
}

function openVolunteerProfile(id) {
    window.location.href = `../Profile/profilepage.html?userId=${id}`;
}




