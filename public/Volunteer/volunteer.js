
const token = localStorage.getItem("token");

const API_BASE = (window.location.origin && window.location.origin !== 'null')
    ? window.location.origin
    : 'https://fsdp-cycling-ltey.onrender.com';

const FALLBACK_AVATAR = "../assets/elderly.jpg";
const FALLBACK_AVATAR_SECONDARY = "../Bali.jpg";

function getAvatarUrl(obj) {
    const url = (obj?.profilepicture || obj?.profilePicture || obj?.avatar || obj?.avatarUrl || "").toString().trim();
    return url || FALLBACK_AVATAR;
}

if (!token) {
    alert("Please log in first");
    window.location.href = "../../index.html";   
}

function openFriendSignedEvents(e, friendId, friendName) {
  if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
  const id = String(friendId || '').trim();
  if (!id) return;
  const name = String(friendName || '').trim();
  const qs = new URLSearchParams({ friendId: id });
  if (name) qs.set('friendName', name);
  window.location.href = `./friend-signed-events.html?${qs.toString()}`;
}

const LAST_SEEN_EVENT_KEY = 'hv_last_seen_eventid';

function getLatestEventId(events) {
    if (!Array.isArray(events) || events.length === 0) return null;
    const ids = events
        .map(e => Number(e.eventid ?? e.EventID ?? e.EventId ?? e.id))
        .filter(n => Number.isFinite(n));
    if (ids.length === 0) return null;
    return Math.max(...ids);
}

function showNewEventBanner(latestEventId) {
    const banner = document.getElementById('eventNewBanner');
    if (!banner) return;

    const text = document.getElementById('eventNewBannerText');
    if (text) text.textContent = 'New event available! Check Booking to sign up.';

    const dismiss = document.getElementById('eventNewBannerDismiss');
    if (dismiss) {
        dismiss.onclick = () => {
            try {
                localStorage.setItem(LAST_SEEN_EVENT_KEY, String(latestEventId));
            } catch (e) {
                // ignore
            }
            banner.style.display = 'none';
        };
    }

    banner.style.display = 'flex';
}

function handleNewEventNotification(events) {
    const latestId = getLatestEventId(events);
    if (!latestId) return;

    let lastSeen = null;
    try {
        lastSeen = Number(localStorage.getItem(LAST_SEEN_EVENT_KEY));
    } catch (e) {
        lastSeen = null;
    }

    if (!Number.isFinite(lastSeen) || lastSeen <= 0) {
        try {
            localStorage.setItem(LAST_SEEN_EVENT_KEY, String(latestId));
        } catch (e) {
            // ignore
        }
        return;
    }

    if (latestId > lastSeen) {
        showNewEventBanner(latestId);
    }
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
    handleNewEventNotification(events);
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
            `${API_BASE}/community/browse/volunteers`,
            {
                method: "GET",
                headers: { "Authorization": `Bearer ${token}` }
            }
        );

        if (!res.ok) {
            if (res.status === 401 || res.status === 403) {
                alert('Login expired, please login again');
                window.location.href = '../../index.html';
                return;
            }
            throw new Error(`Failed to load volunteers (${res.status})`);
        }

        const data = await res.json();
        const volunteers = Array.isArray(data) ? data : [];
        container.innerHTML = "";

        if (volunteers.length === 0) {
            container.innerHTML = `
                <div class="hv-empty">
                    <div class="hv-empty__icon" aria-hidden="true"><i class="fas fa-user"></i></div>
                    <p class="hv-empty__title">No volunteers to show</p>
                    <p class="hv-empty__sub">Please check back later.</p>
                </div>
            `;
            return;
        }

        volunteers.forEach(v => {
            const avatarUrl = getAvatarUrl(v);
            container.innerHTML += `
                <div class="event-box">
                    <div class="service-card volunteer-card"
                         onclick="openVolunteerProfile('${v.id}')">

                        <div class="service-icon">
                            <img
                                src="${avatarUrl}"
                                alt="${v.name}'s avatar"
                                onerror="this.onerror=null;this.src='${FALLBACK_AVATAR_SECONDARY}'"
                                style="width:56px;height:56px;border-radius:12px;object-fit:cover;display:block;"
                            >
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
        container.innerHTML = `
            <div class="hv-empty">
                <div class="hv-empty__icon" aria-hidden="true"><i class="fas fa-triangle-exclamation"></i></div>
                <p class="hv-empty__title">Unable to load volunteers</p>
                <p class="hv-empty__sub">Please try again later.</p>
            </div>
        `;
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
      const friendId = f.friendId ?? f.friend_id ?? f.id;

      filterSection.innerHTML += `
        <div class="fec-accordion">
          <div class="fec-friend-row" onclick="toggleFriendEvents(${idx})" role="button" tabindex="0" aria-expanded="false" aria-controls="friend-events-${idx}">
            <div class="fec-friend-row__left">
              <div class="fec-friend-row__avatar" aria-hidden="true"><i class="fas fa-user"></i></div>
              <div class="fec-friend-row__text">
                <div class="fec-friend-row__name">${friendName}</div>
                <div class="fec-friend-row__sub">${eventCount} event${eventCount !== 1 ? 's' : ''} signed up</div>
              </div>
            </div>
            <div class="fec-friend-row__right">
              <button class="fec-viewall" type="button" onclick="openFriendSignedEvents(event, '${String(friendId ?? '')}', '${String(friendName ?? '').replace(/'/g, "&#039;")}')">View all</button>
              <div class="fec-friend-row__chev" aria-hidden="true">▾</div>
            </div>
          </div>
          <div class="friend-events-expand" id="friend-events-${idx}" style="display:none;"></div>
        </div>
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

  const allContainers = Array.from(document.querySelectorAll('.friend-events-expand'));
  const allRows = Array.from(document.querySelectorAll('.fec-friend-row'));

  // Close all other expanded sections
  allContainers.forEach((el) => {
    el.style.display = 'none';
    el.innerHTML = '';
    el.classList.remove('open');
  });
  allRows.forEach((row) => {
    row.classList.remove('is-open');
    row.setAttribute('aria-expanded', 'false');
  });

  if (isOpen) return; // Was open, now closed

  // Mark row open
  const row = document.querySelector(`.fec-friend-row[aria-controls="friend-events-${idx}"]`);
  if (row) {
    row.classList.add('is-open');
    row.setAttribute('aria-expanded', 'true');
  }

  // Open this one
  const friends = window._friendsSignupData || [];
  const friend = friends[idx];
  if (!friend || !friend.events || friend.events.length === 0) {
    container.innerHTML = `<div class="fec-empty">No events signed up.</div>`;
    container.style.display = 'block';
    container.classList.add('open');
    return;
  }

  // Render events as compact, easy-to-scan rows (elderly-friendly)
  const formatDate = (value) => {
    try {
      return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  container.innerHTML = `
    <div class="fec-events">
      ${friend.events.map((e) => {
        const dateStr = e.eventdate ? formatDate(e.eventdate) : '';
        const loc = e.location || 'TBA';
        return `
          <div class="fec-event-row" role="button" tabindex="0" onclick="goToEventDetail(${e.eventid})">
            <div class="fec-event-row__main">
              <div class="fec-event-row__name">${e.eventname}</div>
              <div class="fec-event-row__meta">
                <span>📍 ${loc}</span>
                ${dateStr ? `<span>📅 ${dateStr}</span>` : ''}
              </div>
            </div>
            <div class="fec-event-row__go" aria-hidden="true">›</div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  container.style.display = 'block';
  container.classList.add('open');
}






document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll('.filter-btn').forEach(button => {
        button.addEventListener('click', () => {
            const category = button.dataset.category;
            loadfilterSection(category);
        });
    });
});




