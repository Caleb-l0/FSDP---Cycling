

const token = localStorage.getItem("token");

if (!token) {
    alert("Please log in first");
    window.location.href = "../../index.html";   
}

/* =====================================================
   WEATHER (DISPLAY BY CURRENT LOCATION ONLY)
   ===================================================== */
function showGeoWeather() {
    const geoDiv = document.getElementById("geo-weather");
    if (!geoDiv) return;

    if (!navigator.geolocation) {
        geoDiv.textContent = "Geolocation is not supported by your browser.";
        return;
    }

    geoDiv.textContent = "Detecting your location...";

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            const apiKey = "3652b8b54e92c83d871ca9705153b07f";
            const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;

            try {
                const res = await fetch(url);
                const data = await res.json();

                geoDiv.innerHTML = `
                    <div class="service-icon">
                        <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="weather">
                    </div>
                    <div class="service-content">
                        <h3>${data.name}</h3>
                        <p>${data.main.temp}°C — ${data.weather[0].description}</p>
                    </div>
                `;
            } catch (err) {
                geoDiv.textContent = "Failed to load weather data.";
            }
        },
        () => {
            geoDiv.textContent = "Location permission denied.";
        }
    );
}
/* =====================================================
   VOLUNTEER FORM
   ===================================================== */
function handleVolunteerFormSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    console.log("Volunteer Form Submitted:", Object.fromEntries(formData.entries()));
    alert("Thank you for signing up as a volunteer!");
}

document.addEventListener("DOMContentLoaded", function () {
    const volunteerForm = document.getElementById("volunteer-form");
    if (volunteerForm) {
        volunteerForm.addEventListener("submit", handleVolunteerFormSubmit);
    }
});

/* =====================================================
   SAMPLE OPPORTUNITIES (OPTIONAL)
   ===================================================== */
function fetchVolunteerOpportunities() {
    const opportunities = [
        { title: "Community Clean-Up", date: "2024-07-15" },
        { title: "Food Drive Assistance", date: "2024-08-01" },
    ];
    console.log("Volunteer Opportunities:", opportunities);
    return opportunities;
}

document.addEventListener("DOMContentLoaded", function () {
    fetchVolunteerOpportunities();
});

/* =====================================================
   HOMEPAGE EVENTS
   ===================================================== */
document.addEventListener("DOMContentLoaded", () => {
    showGeoWeather();       // ✅ WEATHER LOADS HERE
    loadHomepageEvents();
    loadVolunteersHomepage();
    
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

                    <div class="service-icon">
                        <i class="fas fa-calendar"></i>
                    </div>

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

/* =====================================================
   VOLUNTEERS HOMEPAGE
   ===================================================== */
async function loadVolunteersHomepage() {
    const container = document.querySelector("#homepage-volunteers");
    if (!container) return;

    try {
        const res = await fetch(
            "https://fsdp-cycling-ltey.onrender.com/community/browse/volunteers",
            {
                method: "GET",
                headers: { "Authorization": `Bearer ${token}` }
            }
        );

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



// ---- Volunteer Filter Section ---- //
// Haversine formula to calculate distance between two lat/lng points

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

    filterSection.innerHTML = "<p>Loading...</p>";
   
    if (choice === 'location') {
   
    const userLat = parseFloat(localStorage.getItem("userLat"));
    const userLng = parseFloat(localStorage.getItem("userLng"));

    if( !userLat || !userLng){
        alert("Please allow location access to use this feature.");
        getLocation();
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
 else if (choice === 'interest') {
        if (!filterSection) return;
        const res = await fetch(
            "https://fsdp-cycling-ltey.onrender.com/volunteer/events",
            { headers: { Authorization: `Bearer ${token}` } }
        );
        const events = await res.json();

        // For demo, randomly select 5 events as "interest-based"
        const shuffledEvents = events.sort(() => 0.5 - Math.random()).slice(0, 5);
        filterSection.innerHTML = "";

        shuffledEvents.forEach(e => {
            filterSection.innerHTML += `
                <div class="event-box">
                    <div class="service-card"
                         onclick="goToEventDetail(${e.eventid})">
                        <div class="service-icon">
                            <i class="fas fa-heart"></i>
                        </div>
                        <div class="service-content">
                            <h3>${e.eventname}</h3>
                            <p>${e.location}</p>
                        </div>
                    </div>
                </div>
            `;
        }
    );
}
 else if (choice === 'friend') {
        if (!filterSection) return;
        const res = await fetch(
            "https://fsdp-cycling-ltey.onrender.com/volunteer/events",
            { headers: { Authorization: `Bearer ${token}` } }
        );
        const events = await res.json();            
        // For demo, randomly select 5 events as "friend-based"
        const shuffledEvents = events.sort(() => 0.5 - Math.random()).slice(0, 5);
        filterSection.innerHTML = "";   
        shuffledEvents.forEach(e => {
            filterSection.innerHTML += `
                <div class="event-box">
                    <div class="service-card"
                         onclick="goToEventDetail(${e.eventid})">
                        <div class="service-icon">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="service-content">
                            <h3>${e.eventname}</h3>
                            <p>${e.location}</p>
                        </div>
                    </div>
                </div>
            `;
        });
}
}


document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll('.filter-btn').forEach(button => {
        button.addEventListener('click', () => {
            const category = button.dataset.category;
            loadfilterSection(category);
        });
    });
});




