const token = localStorage.getItem("token");
let userRole = null;
const textSizeButtons = document.querySelectorAll('[data-text-size]');
let selectedTextSize = (window.getTextSizePreference ? window.getTextSizePreference() : localStorage.getItem("happyVolunteerTextSize")) || "normal";

if (!token) {
  alert("You must be logged in to access this page.");
  window.location.href = "../../index.html";
}


// Translate page


// Load profile
async function loadProfile() {
  try {
    const params = new URLSearchParams(window.location.search);
    const viewUserId = params.get('userId');

    let data;
    let user;

    if (viewUserId) {
      const response = await fetch(`https://fsdp-cycling-ltey.onrender.com/volunteer/user/profile/${encodeURIComponent(viewUserId)}`);
      if (!response.ok) throw new Error("Failed to load user profile");
      data = await response.json();
      user = data.user || data;

      const title = document.getElementById('profileTitle');
      if (title) title.textContent = 'User Profile';

      if (editBtn) editBtn.style.display = 'none';
      if (saveBtn) saveBtn.style.display = 'none';
      if (editSettingsBtn) editSettingsBtn.style.display = 'none';
      if (saveSettingsBtn) saveSettingsBtn.style.display = 'none';

      const logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) logoutBtn.style.display = 'none';

      hideVolunteerOnlySections();
    } else {
      const response = await fetch("https://fsdp-cycling-ltey.onrender.com/profile", {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Unauthorized");

      data = await response.json();
      console.log("PROFILE API:", data);  

      user = data.user || data; 
    }

    document.getElementById("name").value  = user.name || "";
    document.getElementById("email").value = user.email || "";
    // Role removed - no longer displayed

    // Load settings from profile data (handle both camelCase and lowercase)
    if (user.homeAddress || user.homeaddress) {
      document.getElementById("homeAddress").value = user.homeAddress || user.homeaddress || "";
    }
    if (user.phoneNumber || user.phonenumber || user.phone) {
      document.getElementById("phoneNumber").value = user.phoneNumber || user.phonenumber || user.phone || "";
    }
    if (user.advantages) {
      document.getElementById("advantages").value = user.advantages || "";
    }

    // Load additional data (only for own profile)
    if (!viewUserId) {
      loadEventsAttended();
      loadUserBadges();

      selectedTextSize = data.textSizePreference || selectedTextSize;
      updateTextSizeButtons(selectedTextSize);
      if (window.setTextSizePreference) {
        window.setTextSizePreference(selectedTextSize);
      } else {
        localStorage.setItem("happyVolunteerTextSize", selectedTextSize);
      }
      
      // Apply text size to current page
      applyTextSizeToPage(selectedTextSize);

      if (data.role) {
        userRole = data.role.toLowerCase();
        loadHeaderByRole();
      }

      // Hide volunteer-only sections for admin and institution
      if (userRole && userRole !== 'volunteer') {
        hideVolunteerOnlySections();
      }
    }

  } catch (err) {
    console.error(err);
    alert("Session expired — please log in again.");
    window.location.href='../../index.html'
  }
}

// Hide volunteer-only sections for admin/institution
function hideVolunteerOnlySections() {
  // Hide sidebar buttons for volunteer-only sections
  const settingsBtn = document.querySelector('[data-section="settings"]');
  const eventsBtn = document.querySelector('[data-section="events"]');
  const badgesBtn = document.querySelector('[data-section="badges"]');
  
  if (settingsBtn) settingsBtn.style.display = 'none';
  if (eventsBtn) eventsBtn.style.display = 'none';
  if (badgesBtn) badgesBtn.style.display = 'none';
  
  // Hide the sections themselves
  const settingsSection = document.getElementById('section-settings');
  const eventsSection = document.getElementById('section-events');
  const badgesSection = document.getElementById('section-badges');
  
  if (settingsSection) settingsSection.style.display = 'none';
  if (eventsSection) eventsSection.style.display = 'none';
  if (badgesSection) badgesSection.style.display = 'none';
}

loadProfile();

// Dynamic header based on role


// Logo redirect
function attachLogoRedirect(role) {
  const logo = document.getElementById("logoRedirect");
  if (!logo) return;

  logo.addEventListener("click", function(e) {
    e.preventDefault();
    if (role === "volunteer") window.location.href = "homepage_login_volunteer.html";
    else if (role === "admin") window.location.href = "homepage_login_admin.html";
    else if (role === "institution" || role === "instituition") window.location.href = "homepage_login_instituition.html";
    else window.location.href = "homepage.html";
  });
}

// Edit / Save
const nameField = document.getElementById("name");
const emailField = document.getElementById("email");
const editBtn = document.getElementById("editBtn");
const saveBtn = document.getElementById("saveBtn");
const translate = document.getElementById("translate")

function updateTextSizeButtons(mode) {
  textSizeButtons.forEach((button) => {
    const isSelected = button.dataset.textSize === mode;
    button.setAttribute("aria-pressed", String(isSelected));
    button.classList.toggle("active", isSelected);
  });
}

async function handleTextSizeChange(mode) {
  if (!mode || mode === selectedTextSize) return;
  try {
    const response = await fetch("https://fsdp-cycling-ltey.onrender.com/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ textSizePreference: mode })
    });

    if (!response.ok) throw new Error("Text size update failed");

    selectedTextSize = mode;
    updateTextSizeButtons(mode);
    if (window.setTextSizePreference) {
      window.setTextSizePreference(mode);
    } else {
      localStorage.setItem("happyVolunteerTextSize", mode);
    }
    
    // Apply text size to current page
    applyTextSizeToPage(mode);
    
    alert("Text size updated across all volunteer pages.");
  } catch (err) {
    console.error(err);
    alert("Unable to update text size.");
  }
}

// Apply text size preference to current page
function applyTextSizeToPage(mode) {
  if (mode === 'large') {
    document.body.classList.add('elderly-mode');
    document.documentElement.setAttribute('data-text-size', 'large');
  } else {
    document.body.classList.remove('elderly-mode');
    document.documentElement.setAttribute('data-text-size', 'normal');
  }
}


editBtn.addEventListener("click", () => {
  nameField.disabled = false;
  emailField.disabled = false;
  editBtn.style.display = "none";
  saveBtn.style.display = "inline-block";
});

saveBtn.addEventListener("click", async () => {
  const newName = nameField.value;
  const newEmail = emailField.value;

  try {
    // Get current settings values
    const homeAddress = document.getElementById("homeAddress")?.value || null;
    const phoneNumber = document.getElementById("phoneNumber")?.value || null;
    const advantages = document.getElementById("advantages")?.value || null;

    const response = await fetch("https://fsdp-cycling-ltey.onrender.com/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ 
        name: newName, 
        email: newEmail, 
        textSizePreference: selectedTextSize,
        homeAddress: homeAddress,
        phoneNumber: phoneNumber,
        advantages: advantages
      })
    });

    if (!response.ok) throw new Error("Update failed");

    alert("Profile updated successfully!");
    nameField.disabled = true;
    emailField.disabled = true;
    editBtn.style.display = "inline-block";
    saveBtn.style.display = "none";

  } catch (err) {
    console.error(err);
    alert("Error updating profile.");
  }
});

// Logout button
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.clear();
  alert("Logged out successfully!");
  window.location.href = "/index.html";
});









textSizeButtons.forEach((button) =>
  button.addEventListener("click", () => handleTextSizeChange(button.dataset.textSize))
);

updateTextSizeButtons(selectedTextSize);

// --- nav bar section 
function getUserRoleFromToken() {
  const token = localStorage.getItem("token");
  if (!token) return null;

  const payload = token.split(".")[1];
  const decoded = JSON.parse(atob(payload));

  return decoded.role;   
}





function loadHeaderByRole() {

  const mainNav = document.getElementById("mainNav");   // Desktop
  const mobileNav = document.getElementById("hvNav");   // Mobile
  const logo = document.getElementById("logoRedirect");
  const role = getUserRoleFromToken();

  let navHTML = "";
  let logoHref = "";

  // ADMIN
  if (role === "admin") {
    navHTML = `
      <ul>
        <li><a href="../Admin/createEvent.html">Create Event</a></li>
        <li><a href="#">Notification</a></li>
        <li><a href="#">History</a></li>
        <li><a href="./profilepage.html">Profile</a></li>
      </ul>`;
    logoHref = "../Admin/homepage_login_Admin.html";
  }

  // VOLUNTEER
  if (role === "volunteer") {
    navHTML = `
      <ul>
                <li><a href="./volunteer-events.html">Booking</a></li>
                <li><a href="./volunteer_community_page.html">Community</a></li>
                <li><a href="./volunteer_rewards.html">Reward</a></li>
                <li><a href="./Volunteer_friend.html">Friends</a></li>
                <li><a href="../Profile/profilepage.html">Profile</a></li>
      </ul>`;
    logoHref = "../Volunteer/homepage_login_volunteer.html";
  }

  // INSTITUTION
  if (role === "institution") {
    navHTML = `
      <ul>
        <li><a href="../Instituition/organization_apply_event.html">Apply Event</a></li>
        <li><a href="#">Community</a></li>
        <li><a href="#">Notification</a></li>
        <li><a href="#">History</a></li>
        <li><a href="./profilepage.html">Profile</a></li>
      </ul>`;
    logoHref = "../Instituition/homepage_login_instituition.html";
  }

 
  mainNav.innerHTML = navHTML;
  mobileNav.innerHTML = navHTML;


  logo.href = logoHref;
}

// ======================================================
// Switch Profile Sections
// ======================================================
function switchProfileSection(section) {
  // Hide all sections
  document.querySelectorAll('.profile-section').forEach(sec => {
    sec.style.display = 'none';
  });
  
  // Remove active class from all buttons
  document.querySelectorAll('.profile-nav-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Show selected section
  const targetSection = document.getElementById(`section-${section}`);
  if (targetSection) {
    targetSection.style.display = 'block';
  }
  
  // Add active class to clicked button
  const activeBtn = document.querySelector(`[data-section="${section}"]`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  // Scroll to top of section
  if (targetSection) {
    targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}


// ======================================================
// Get Current Location for Address
// ======================================================
function getCurrentLocation() {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser.");
    return;
  }

  const addressInput = document.getElementById("homeAddress");
  addressInput.value = "Getting your location...";
  addressInput.disabled = true;

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      
      try {
        // Use reverse geocoding API (OpenStreetMap Nominatim - free)
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
          {
            headers: {
              'User-Agent': 'HappyVolunteer/1.0'
            }
          }
        );
        
        const data = await response.json();
        if (data.address) {
          const addressParts = [];
          if (data.address.road) addressParts.push(data.address.road);
          if (data.address.house_number) addressParts.push(data.address.house_number);
          if (data.address.postcode) addressParts.push(data.address.postcode);
          if (data.address.city || data.address.town) {
            addressParts.push(data.address.city || data.address.town);
          }
          
          addressInput.value = addressParts.join(", ") || data.display_name || `${lat}, ${lng}`;
        } else {
          addressInput.value = `${lat}, ${lng}`;
        }
      } catch (err) {
        console.error("Geocoding error:", err);
        addressInput.value = `${lat}, ${lng}`;
      }
      
      addressInput.disabled = false;
    },
    (error) => {
      console.error("Geolocation error:", error);
      alert("Unable to get your location. Please enter it manually.");
      addressInput.value = "";
      addressInput.disabled = false;
    }
  );
}

// ======================================================
// Edit/Save Settings
// ======================================================
const editSettingsBtn = document.getElementById("editSettingsBtn");
const saveSettingsBtn = document.getElementById("saveSettingsBtn");

if (editSettingsBtn) {
  editSettingsBtn.addEventListener("click", () => {
    document.getElementById("homeAddress").disabled = false;
    document.getElementById("phoneNumber").disabled = false;
    document.getElementById("advantages").disabled = false;
    document.getElementById("getLocationBtn").disabled = false;
    editSettingsBtn.style.display = "none";
    saveSettingsBtn.style.display = "inline-block";
  });
}

if (saveSettingsBtn) {
  saveSettingsBtn.addEventListener("click", async () => {
    const homeAddress = document.getElementById("homeAddress").value;
    const phoneNumber = document.getElementById("phoneNumber").value;
    const advantages = document.getElementById("advantages").value;

    try {
      const response = await fetch("https://fsdp-cycling-ltey.onrender.com/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          homeAddress,
          phoneNumber,
          advantages
        })
      });

      if (!response.ok) throw new Error("Update failed");

      alert("Settings saved successfully!");
      document.getElementById("homeAddress").disabled = true;
      document.getElementById("phoneNumber").disabled = true;
      document.getElementById("advantages").disabled = true;
      document.getElementById("getLocationBtn").disabled = true;
      editSettingsBtn.style.display = "inline-block";
      saveSettingsBtn.style.display = "none";

    } catch (err) {
      console.error(err);
      alert("Error saving settings.");
    }
  });
}

// ======================================================
// Load Events Attended
// ======================================================
async function loadEventsAttended() {
  const eventsList = document.getElementById("eventsAttendedList");
  if (!eventsList) return;

  try {
    const response = await fetch("https://fsdp-cycling-ltey.onrender.com/volunteer/signed-events", {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!response.ok) throw new Error("Failed to load events");

    const events = await response.json();
    
    if (!events || events.length === 0) {
      eventsList.innerHTML = '<p class="empty-text">No events attended yet. Start volunteering to see your events here!</p>';
      return;
    }

    eventsList.innerHTML = events.map(event => `
      <div class="event-item-card">
        <h4>${event.eventname || event.EventName || "Untitled Event"}</h4>
        <p><strong>Date:</strong> ${new Date(event.eventdate || event.EventDate).toLocaleDateString()}</p>
        <p><strong>Location:</strong> ${event.location || "TBA"}</p>
        ${event.description ? `<p>${event.description}</p>` : ""}
      </div>
    `).join("");

  } catch (err) {
    console.error("Error loading events:", err);
    eventsList.innerHTML = '<p class="empty-text">Unable to load events. Please try again later.</p>';
  }
}

// ======================================================
// Load User Badges
// ======================================================
async function loadUserBadges() {
  const badgesList = document.getElementById("badgesList");
  if (!badgesList) return;

  try {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      badgesList.innerHTML = '<p class="empty-text">Please log in to see your badges.</p>';
      return;
    }

    const response = await fetch(`https://fsdp-cycling-ltey.onrender.com/volunteer/user/profile/${userId}`);
    
    if (!response.ok) throw new Error("Failed to load badges");

    const data = await response.json();
    const badges = data.badges || [];
    
    if (!badges || badges.length === 0) {
      badgesList.innerHTML = '<p class="empty-text">No badges earned yet. Keep volunteering to earn badges!</p>';
      return;
    }

    badgesList.innerHTML = badges.map(badge => `
      <div class="badge-card">
        <div class="badge-icon">${badge.iconurl ? `<img src="${badge.iconurl}" alt="${badge.badgename}" style="width: 60px; height: 60px;">` : "🏅"}</div>
        <div class="badge-name">${badge.badgename}</div>
        ${badge.description ? `<div class="badge-description">${badge.description}</div>` : ""}
      </div>
    `).join("");

  } catch (err) {
    console.error("Error loading badges:", err);
    badgesList.innerHTML = '<p class="empty-text">Unable to load badges. Please try again later.</p>';
  }
}

window.scrollTo({
  top: 0,
  behavior: 'smooth'
});
