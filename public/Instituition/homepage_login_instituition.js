


if (!token || role !== "institution") {
  alert("You do not have access to this page.");
  window.location.href = "../../index.html";
}

const API_BASE = 'https://fsdp-cycling-ltey.onrender.com';


// Dashboard elements
const title1 = document.getElementById("title1");
const title2 = document.getElementById("title2");
const title3 = document.getElementById("title3");
const dashboard1 = document.getElementById("dashboard1");
const dashboard2 = document.getElementById("dashboard2");
const dashboard3 = document.getElementById("dashboard3");

// Grids
const eventGrid = document.getElementById("eventGrid");
const applicationsGrid = document.getElementById("applicationsGrid");
const approvedGrid = document.getElementById("approvedGrid");

// Get organization ID
async function getOrganizationId() {
  try {
    if (!token) {
      console.warn('No token available for organization ID request');
      return null;
    }

    const response = await fetch(`${API_BASE}/user/organization-id`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (jsonError) {
        const textResponse = await response.text();
        console.error('Failed to parse error response:', textResponse);
        errorData = { message: `Status ${response.status}: ${textResponse.substring(0, 100)}` };
      }
      
      // Only log as error if it's a 500, otherwise it's expected (user might not have org)
      if (response.status === 500) {
        console.error('Server error getting organization ID:', errorData);
      } else {
        console.warn('Failed to get organization ID:', errorData.message || `Status ${response.status}`);
      }
      return null; // Return null instead of throwing - institution might not have org yet
    }

    const data = await response.json();
    return data.organizationId || null;
  } catch (error) {
    console.error('Error getting organization ID:', error);
    return null; // Return null on error - page should still work
  }
}

// Dashboard tab switching
title1.addEventListener("click", function() {
  title2.classList.remove("dashboard_title_selected");
  title2.classList.add("dashboard_title_not_selected");
  title3.classList.remove("dashboard_title_selected");
  title3.classList.add("dashboard_title_not_selected");
  title1.classList.remove("dashboard_title_not_selected");
  title1.classList.add("dashboard_title_selected");
  
  dashboard1.style.display = "block";
  dashboard2.style.display = "none";
  dashboard3.style.display = "none";
  
  loadAllEvents("all");
});

title2.addEventListener("click", function() {
  title1.classList.remove("dashboard_title_selected");
  title1.classList.add("dashboard_title_not_selected");
  title3.classList.remove("dashboard_title_selected");
  title3.classList.add("dashboard_title_not_selected");
  title2.classList.remove("dashboard_title_not_selected");
  title2.classList.add("dashboard_title_selected");
  
  dashboard1.style.display = "none";
  dashboard2.style.display = "block";
  dashboard3.style.display = "none";
  
  loadMyApplications();
});

title3.addEventListener("click", function() {
  title1.classList.remove("dashboard_title_selected");
  title1.classList.add("dashboard_title_not_selected");
  title2.classList.remove("dashboard_title_selected");
  title2.classList.add("dashboard_title_not_selected");
  title3.classList.remove("dashboard_title_not_selected");
  title3.classList.add("dashboard_title_selected");
  
  dashboard1.style.display = "none";
  dashboard2.style.display = "none";
  dashboard3.style.display = "block";
  
  loadApprovedApplications();
});

// Filter buttons for dashboard1
const filterAll = document.getElementById("filter_all");
const filterAssigned = document.getElementById("filter_assigned");
const filterNotAssigned = document.getElementById("filter_not_assigned");
const filterExpired = document.getElementById("filter_expired");

filterAll.addEventListener("click", () => {
  setActiveFilter(filterAll);
  loadAllEvents("all");
});

filterAssigned.addEventListener("click", () => {
  setActiveFilter(filterAssigned);
  loadAllEvents("assigned");
});

filterNotAssigned.addEventListener("click", () => {
  setActiveFilter(filterNotAssigned);
  loadAllEvents("not_assigned");
});

filterExpired.addEventListener("click", () => {
  setActiveFilter(filterExpired);
  loadAllEvents("expired");
});

function setActiveFilter(activeBtn) {
  [filterAll, filterAssigned, filterNotAssigned, filterExpired].forEach(btn => {
    btn.classList.remove("active");
  });
  activeBtn.classList.add("active");
}

// Load all events created by admin
async function loadAllEvents(filter = "all") {
  try {
    const response = await fetch(`${API_BASE}/admin/events`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error("Failed to load events");
    }

    const events = await response.json();
    eventGrid.innerHTML = "";

    if (!Array.isArray(events) || events.length === 0) {
      eventGrid.innerHTML = `<p style="text-align:center;color:#777;">No events found.</p>`;
      return;
    }

    // Filter events
    let filteredEvents = events;
    const currentDate = new Date();
    
    if (filter === "assigned") {
      filteredEvents = events.filter(ev => ev.organizationid !== null);
    } else if (filter === "not_assigned") {
      filteredEvents = events.filter(ev => ev.organizationid === null);
    } else if (filter === "expired") {
      filteredEvents = events.filter(ev => new Date(ev.eventdate) < currentDate);
    }

    filteredEvents.forEach(event => {
      const card = createEventCard(event);
      eventGrid.appendChild(card);
    });

  } catch (err) {
    console.error("Error loading events:", err);
    eventGrid.innerHTML = `<p style="text-align:center;color:red;">Unable to load events.</p>`;
  }
}
async function getOrganizationId() {
  try {
    if (!token) {
      console.warn('No token available for organization ID request');
      return null;
    }

    const response = await fetch(`${API_BASE}/user/organization-id`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (jsonError) {
        const textResponse = await response.text();
        console.error('Failed to parse error response:', textResponse);
        errorData = { message: `Status ${response.status}: ${textResponse.substring(0, 100)}` };
      }
      
      // Only log as error if it's a 500, otherwise it's expected (user might not have org)
      if (response.status === 500) {
        console.error('Server error getting organization ID:', errorData
);      } else {
        console.warn('Failed to get organization ID:', errorData.message || `Status ${response.status}`);
      }
      return null; // Return null instead of throwing - institution might not have org yet
    }

    const data = await response.json();
    return data.organizationId || null;
  } catch (error) {
    console.error('Error getting organization ID:', error);
    return null; // Return null on error - page should still work
  }
}

// Load my applications (pending bookings)
async function loadMyApplications() {
  

  if (!organizationId) {
    organizationId = await getOrganizationId();
  }

  if (!organizationId) {
    applicationsGrid.innerHTML = `<p style="text-align:center;color:orange;">You are not associated with an organization yet. Please contact support to set up your organization.</p>`;
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/organization/events/my-bookings`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error("Failed to load applications");
    }

    const applications = await response.json();
    applicationsGrid.innerHTML = "";

    // Filter to show only pending applications
    const pendingApplications = applications.filter(app => app.status === 'Pending');

    if (pendingApplications.length === 0) {
      applicationsGrid.innerHTML = `<p style="text-align:center;color:#777;">No pending applications found.</p>`;
      return;
    }

    pendingApplications.forEach(app => {
      const card = createApplicationCard(app);
      applicationsGrid.appendChild(card);
    });

  } catch (err) {
    console.error("Error loading applications:", err);
    applicationsGrid.innerHTML = `<p style="text-align:center;color:red;">Unable to load applications.</p>`;
  }
}

// Load approved applications
async function loadApprovedApplications() {
  if (!organizationId) {
    organizationId = await getOrganizationId();
  }

  if (!organizationId) {
    approvedGrid.innerHTML = `<p style="text-align:center;color:orange;">You are not associated with an organization yet. Please contact support to set up your organization.</p>`;
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/organization/events/my-bookings`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error("Failed to load approved applications");
    }

    const applications = await response.json();
    approvedGrid.innerHTML = "";

    // Filter to show only approved applications
    const approvedApplications = applications.filter(app => app.status === 'Approved');

    if (approvedApplications.length === 0) {
      approvedGrid.innerHTML = `<p style="text-align:center;color:#777;">No approved applications found.</p>`;
      return;
    }

    approvedApplications.forEach(app => {
      const card = createApprovedApplicationCard(app);
      approvedGrid.appendChild(card);
    });

  } catch (err) {
    console.error("Error loading approved applications:", err);
    approvedGrid.innerHTML = `<p style="text-align:center;color:red;">Unable to load approved applications.</p>`;
  }
}

// Create event card
function createEventCard(event) {
  const card = document.createElement("div");
  card.classList.add("event-card2");
  card.style.cursor = "pointer";

  const eventDate = event.eventdate || event.EventDate;
  const formattedDate = eventDate ? new Date(eventDate).toLocaleString() : 'Date TBD';
  const eventName = event.eventname || event.EventName || 'Untitled Event';
  const location = event.location || event.Location || 'Location TBD';
  const requiredVolunteers = event.requiredvolunteers || event.RequiredVolunteers || 0;
  const isAssigned = event.organizationid !== null;

  card.innerHTML = `
    <div class="event-img" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 150px; display: flex; align-items: center; justify-content: center; color: white; font-size: 2rem;">🚴</div>
    <div class="event-info">
      <h3>${eventName}</h3>
      <p><strong>Time:</strong> ${formattedDate}</p>
      <p><strong>Location:</strong> ${location}</p>
      <p><strong>People Needed:</strong> ${requiredVolunteers}</p>
      <span class="status-tag ${isAssigned ? 'status-assigned' : 'status-available'}">
        ${isAssigned ? 'Assigned' : 'Available'}
      </span>
    </div>
  `;

  card.addEventListener("click", () => {
    localStorage.setItem("currentEvent", JSON.stringify(event));
    window.location.href = "./institution_event_detail.html";
  });

  return card;
}

// Create application card (pending)
function createApplicationCard(application) {
  const card = document.createElement("div");
  card.classList.add("event-card2");
  card.style.cursor = "pointer";

  const eventName = application.eventname || application.EventName || 'Unknown Event';
  const eventDate = application.eventdate || application.EventDate;
  const formattedDate = eventDate ? new Date(eventDate).toLocaleDateString() : 'Date TBD';
  const location = application.location || application.Location || 'Location TBD';
  const participants = application.participants || 0;

  card.innerHTML = `
    <div class="event-info">
      <h3>${eventName}</h3>
      <p><strong>Date:</strong> ${formattedDate}</p>
      <p><strong>Location:</strong> ${location}</p>
      <p><strong>Participants:</strong> ${participants}</p>
      <span class="status-tag status-pending">Pending</span>
    </div>
  `;

  card.addEventListener("click", () => {
    localStorage.setItem("currentApplication", JSON.stringify(application));
    window.location.href = "./institution_event_detail.html";
  });

  return card;
}

// Create approved application card
function createApprovedApplicationCard(application) {
  const card = document.createElement("div");
  card.classList.add("event-card2");
  card.style.cursor = "pointer";

  const eventName = application.eventname || application.EventName || 'Unknown Event';
  const eventDate = application.eventdate || application.EventDate;
  const formattedDate = eventDate ? new Date(eventDate).toLocaleDateString() : 'Date TBD';
  const location = application.location || application.Location || 'Location TBD';
  const participants = application.participants || 0;
  const sessionHead = application.session_head_name || 'Not assigned';

  card.innerHTML = `
    <div class="event-info">
      <h3>${eventName}</h3>
      <p><strong>Date:</strong> ${formattedDate}</p>
      <p><strong>Location:</strong> ${location}</p>
      <p><strong>Participants:</strong> ${participants}</p>
      <p><strong>Session Head:</strong> ${sessionHead}</p>
      <span class="status-tag status-approved">Approved</span>
    </div>
  `;

  card.addEventListener("click", () => {
    localStorage.setItem("currentApplication", JSON.stringify(application));
    window.location.href = "./institution_event_detail.html";
  });

  return card;
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", async () => {
  try {
    organizationId = await getOrganizationId();
    if (!organizationId) {
      console.warn("No organization ID found. Some features may be limited.");
      // Still load events - they might be available to all institutions
    }
    loadAllEvents("all");
  } catch (error) {
    console.error("Error initializing page:", error);
    // Still try to load events even if organization ID fetch fails
    loadAllEvents("all");
  }
});

