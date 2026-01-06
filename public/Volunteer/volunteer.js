const { load } = require("npm");

const token = localStorage.getItem("token");

if (!token) {
    alert("Please log in first");
    window.location.href = "../../index.html";   
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
                    onclick="goToEventDetail(${e.eventid})">

                    <div class="service-icon"><i class="fas fa-calendar"></i></div>

                    <div class="service-content">
                        <h3>${e.eventname}</h3>
                        <p>${new Date(e.eventdate).toLocaleDateString()}</p>
                        <p>${e.location}</p>
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

function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}


// volunteer filter event button
const filterSection = document.getElementById('filter-section');
 
async function loadfilterSection(choice) {
    const filterSection = document.getElementById("filter-section");
    if (!filterSection) return;

    const userLat = parseFloat(localStorage.getItem("userLat"));
    const userLng = parseFloat(localStorage.getItem("userLng"));

    if (!userLat || !userLng) {
        alert("Unable to get your location");
        return;
    }

    const res = await fetch(
        "https://fsdp-cycling-ltey.onrender.com/volunteer/events",
        { headers: { Authorization: `Bearer ${token}` } }
    );

    const events = await res.json();

    // Haversine formula to calculate distance between two lat/lng points

    const sortedEvents = events
        .filter(e => e.latitude && e.longitude)
        .map(e => ({
            ...e,
            distance: getDistance(
                userLat,
                userLng,
                e.latitude,
                e.longitude
            )
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 5); // recommend top 5 closest events 

    filterSection.innerHTML = "";

    sortedEvents.forEach(e => {
        filterSection.innerHTML += `
            <div class="event-box">
                <div class="service-card"
                     onclick="goToEventDetail(${e.eventid})">

                    <div class="service-icon">
                        <i class="fas fa-map-marker-alt"></i>
                    </div>

                    <div class="service-content">
                        <h3>${e.eventname}</h3>
                        <p>${e.location}</p>
                        <p>📍 ${e.distance.toFixed(1)} km away</p>
                    </div>

                </div>
            </div>
        `;
    });
}



document.querySelectorAll('.filter-btn').forEach(button => {
    button.addEventListener('click', () => {
        const category = button.getAttribute('data-category');


        if (category === 'location') {
            loadfilterSection('location');
        } else if (category === 'interest') {
            loadfilterSection('interest');
        } else if (category === 'friend') {
           load
        }
    });
});



