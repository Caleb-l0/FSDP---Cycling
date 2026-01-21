
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

                // Determine weather type based on icon code
                const iconCode = data.weather[0].icon;
                let weatherClass = '';
                if (iconCode.startsWith('01')) {
                    weatherClass = 'weather-sunny'; // Clear sky - sunny
                } else if (iconCode.startsWith('09') || iconCode.startsWith('10') || iconCode.startsWith('11')) {
                    weatherClass = 'weather-rainy'; // Rain or thunderstorm
                } else if (iconCode.startsWith('03') || iconCode.startsWith('04') || iconCode.startsWith('02')) {
                    weatherClass = 'weather-cloudy'; // Clouds
                }

                geoDiv.innerHTML = `
                    <div class="service-icon ${weatherClass}">
                        <img src="https://openweathermap.org/img/wn/${iconCode}@2x.png" alt="weather" class="weather-icon">
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
    // Only check elderly preference if user is logged in and is volunteer
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    
    if (token && role === "volunteer") {
        checkElderlyUserPreference();
    }
    
    loadHomepageEvents();
    loadVolunteersHomepage();
});

// Elderly User Detection
function checkElderlyUserPreference() {
    const userType = localStorage.getItem('userType'); // 'elderly' or 'normal'
    
    // If user type not set, show popup (only show once per session)
    if (!userType && !sessionStorage.getItem('elderlyPopupShown')) {
        showElderlyUserPopup();
        sessionStorage.setItem('elderlyPopupShown', 'true');
    } else if (userType) {
        // Apply saved preference
        applyUserTypePreference(userType);
    }
}

function showElderlyUserPopup() {
    const popup = document.getElementById('elderlyUserPopup');
    if (popup) {
        popup.style.display = 'flex';
    }
}

function selectUserType(type) {
    localStorage.setItem('userType', type);
    
    // Set text size preference
    const textPreference = type === 'elderly' ? 'elderly' : 'normal';
    localStorage.setItem('textSizePreference', textPreference);
    
    // Apply text size immediately
    if (type === 'elderly') {
        applyElderlyTextSize();
    } else {
        applyNormalTextSize();
    }
    
    // Hide popup
    const popup = document.getElementById('elderlyUserPopup');
    if (popup) {
        popup.style.display = 'none';
    }
    
    // Save to backend
    saveTextSizePreference();
}

function applyUserTypePreference(type) {
    if (type === 'elderly') {
        applyElderlyTextSize();
    } else {
        applyNormalTextSize();
    }
}

function applyElderlyTextSize() {
    // Elderly text: slightly larger than large, but not too big
    document.body.classList.add('elderly-mode');
    document.body.classList.remove('normal-mode');
    
    // Also apply to all elements if needed
    const style = document.createElement('style');
    style.id = 'elderly-text-style';
    style.textContent = `
        body.elderly-mode {
            font-size: 1.2rem !important;
            line-height: 1.7 !important;
        }
        body.elderly-mode h1 { font-size: 2.4rem !important; }
        body.elderly-mode h2 { font-size: 2rem !important; }
        body.elderly-mode h3 { font-size: 1.6rem !important; }
        body.elderly-mode .hv-logo { font-size: 1.8rem !important; }
        body.elderly-mode nav a { font-size: 1.1rem !important; padding: 12px 20px !important; }
        body.elderly-mode button { font-size: 1.05rem !important; min-height: 50px !important; }
        body.elderly-mode input { font-size: 1.05rem !important; min-height: 50px !important; }
    `;
    
    // Remove existing style if present
    const existingStyle = document.getElementById('elderly-text-style');
    if (existingStyle) existingStyle.remove();
    
    document.head.appendChild(style);
}

function applyNormalTextSize() {
    document.body.classList.add('normal-mode');
    document.body.classList.remove('elderly-mode');
}

async function saveTextSizePreference() {
    const token = localStorage.getItem('token');
    const preference = localStorage.getItem('textSizePreference') || 'normal';
    
    try {
        await fetch('https://fsdp-cycling-ltey.onrender.com/profile', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                textSizePreference: preference
            })
        });
    } catch (err) {
        console.error('Failed to save text size preference:', err);
    }
}



// ---- Volunteer Homepage Events Section ---- //


function getLocation() {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser");
    return;
  } 
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            console.log("Latitude:", lat);
            console.log("Longitude:", lng);
            localStorage.setItem("userLat", lat);
            localStorage.setItem("userLng", lng);
        },
        (error) => {
            alert("Error getting location: " + error.message);
        }
    );
}


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
    window.location.href = `./userProfile.html?userId=${id}`;
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
    // Reset vertical mode class when switching filters
    filterSection.classList.remove("fec-vertical-mode");

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

  filterSection.innerHTML = `<p>Loading friends...</p>`;

  try {
    const res = await fetch(
      "https://fsdp-cycling-ltey.onrender.com/volunteer/friends/signup-events",
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const friends = await res.json();

    if (!Array.isArray(friends) || friends.length === 0) {
      filterSection.innerHTML = `
        <div class="event-box">
          <div class="service-card">
            <div class="service-icon"><i class="fas fa-users"></i></div>
            <div class="service-content">
              <h3>No friend activity yet</h3>
              <p>Your friends haven't joined any events.</p>
            </div>
          </div>
        </div>`;
      return;
    }

    // Store friends data globally for toggle function
    window._friendsSignupData = friends;

    filterSection.innerHTML = "";
    friends.forEach((f, idx) => {
      const friendName = f.friendName || "Friend";
      const eventCount = (f.events || []).length;

      filterSection.innerHTML += `
        <div class="event-box">
          <div class="service-card" onclick="toggleFriendEvents(${idx})" role="button" tabindex="0">
            <div class="service-icon">
              <i class="fas fa-user"></i>
            </div>
            <div class="service-content">
              <h3>${friendName}</h3>
              <p>${eventCount} event${eventCount !== 1 ? 's' : ''} signed up</p>
            </div>
          </div>
        </div>
        <div class="friend-events-expand" id="friend-events-${idx}" style="display:none;"></div>
      `;
    });
  } catch (err) {
    console.error(err);
    filterSection.innerHTML = `<p class="error-text">Failed to load friends.</p>`;
  }
}
}

// Toggle friend's events when clicking on a friend card
function toggleFriendEvents(idx) {
  const container = document.getElementById(`friend-events-${idx}`);
  if (!container) return;

  const isOpen = container.style.display !== 'none';

  // Close all other expanded sections
  document.querySelectorAll('.friend-events-expand').forEach(el => {
    el.style.display = 'none';
    el.innerHTML = '';
  });

  if (isOpen) return; // Was open, now closed

  // Open this one
  const friends = window._friendsSignupData || [];
  const friend = friends[idx];
  if (!friend || !friend.events || friend.events.length === 0) {
    container.innerHTML = `<p style="padding:12px; color:#64748b;">No events signed up.</p>`;
    container.style.display = 'block';
    return;
  }

  // Render events in same style as "Nearer to You"
  let html = '';
  friend.events.forEach(e => {
    const dateStr = e.eventdate
      ? new Date(e.eventdate).toLocaleDateString(undefined, { month: "short", day: "numeric" })
      : "";
    html += `
      <div class="event-box" style="margin-left: 24px;">
        <div class="service-card" onclick="goToEventDetail(${e.eventid})" role="button" tabindex="0">
          <div class="service-icon">
            <i class="fas fa-calendar"></i>
          </div>
          <div class="service-content">
            <h3>${e.eventname}</h3>
            <p>${e.location || "TBA"}</p>
            ${dateStr ? `<p>📅 ${dateStr}</p>` : ""}
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
  container.style.display = 'block';
}






document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll('.filter-btn').forEach(button => {
        button.addEventListener('click', () => {
            const category = button.dataset.category;
            loadfilterSection(category);
        });
    });
});




