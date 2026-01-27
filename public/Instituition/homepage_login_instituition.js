
const token = localStorage.getItem('token');
const role = localStorage.getItem('role');

if (!token || role !== "institution") {
  alert("You do not have access to this page.");
  window.location.href = "../../index.html";
}

function formatMemberInitials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  return parts.map(p => p[0]).join('').slice(0, 2).toUpperCase();
}

function formatShortDate(dt) {
  if (!dt) return '';
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

async function loadOrganizationMembersExperience() {
  if (!membersGrid) return;
  try {
    const resp = await fetch(`${API_BASE}/organization/members/experience`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (resp.status === 401 || resp.status === 403) {
      handleAuthFailure('Invalid token. Please log in again.');
      return;
    }

    if (!resp.ok) {
      throw new Error('Failed to load members');
    }

    const members = await resp.json();
    const arr = Array.isArray(members) ? members : [];

    const countEl = document.getElementById('members-count');
    if (countEl) countEl.textContent = arr.length;

    if (arr.length === 0) {
      membersGrid.innerHTML = `<div class="empty-state"><i class="fas fa-users"></i><p>No members found.</p></div>`;
      return;
    }

    membersGrid.innerHTML = '';
    arr.forEach((m) => {
      const id = m.id;
      const name = m.name || 'Unnamed';
      const orgRole = m.orgrole || 'Member';
      const email = m.email || '';
      const phone = m.phone || '';
      const eventCount = Number(m.eventcount || 0);
      const events = Array.isArray(m.events) ? m.events : [];

      const card = document.createElement('div');
      card.className = 'member-card';

      const eventsHtml = events
        .filter(e => e && (e.eventName || e.eventname))
        .slice(0, 6)
        .map((e) => {
          const eventName = e.eventName || e.eventname || 'Event';
          const eventDate = formatShortDate(e.eventDate || e.eventdate);
          return `
            <div class="member-event-item">
              <div>
                <div class="member-event-name">${eventName}</div>
              </div>
              <div class="member-event-date">${eventDate}</div>
            </div>
          `;
        })
        .join('');

      card.innerHTML = `
        <div class="member-head">
          <div class="member-avatar">${formatMemberInitials(name)}</div>
          <div>
            <p class="member-name">${name}</p>
            <div class="member-sub">${orgRole}${email ? ` • ${email}` : ''}</div>
          </div>
        </div>
        <div class="member-stats">
          <span class="member-pill"><i class="fas fa-flag"></i> Event Head: ${eventCount}</span>
          ${phone ? `<span class="member-pill"><i class="fas fa-phone"></i> ${phone}</span>` : ''}
        </div>
        <div class="member-actions">
          <button class="member-btn member-btn-primary" type="button" data-action="toggle">
            <i class="fas fa-list"></i>
            View Events
          </button>
          ${id ? `
            <button class="member-btn member-btn-secondary" type="button" data-action="profile">
              <i class="fas fa-id-card"></i>
              Profile
            </button>
          ` : ''}
        </div>
        <div class="member-events" data-events>
          ${eventsHtml || '<div style="color:#64748b;font-weight:700;">No events yet.</div>'}
          ${events.length > 6 ? '<div style="margin-top:10px;color:#64748b;font-weight:700;">Showing latest 6 events.</div>' : ''}
        </div>
      `;

      const eventsWrap = card.querySelector('[data-events]');
      const toggleBtn = card.querySelector('[data-action="toggle"]');
      const profileBtn = card.querySelector('[data-action="profile"]');

      if (toggleBtn && eventsWrap) {
        toggleBtn.addEventListener('click', () => {
          eventsWrap.classList.toggle('is-open');
        });
      }

      if (profileBtn && id) {
        profileBtn.addEventListener('click', () => {
          window.location.href = `../Profile/profilepage.html?userId=${encodeURIComponent(id)}`;
        });
      }

      membersGrid.appendChild(card);
    });
  } catch (e) {
    console.error('Error loading members experience:', e);
    if (membersGrid) {
      membersGrid.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Unable to load members. Please try again.</p></div>`;
    }
  }
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function loadInstitutionCommunityFeed() {
  const list = document.getElementById('communityFeedList');
  if (!list) return;

  try {
    const res = await fetch(`${API_BASE}/institution/community/feed?limit=6`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.status === 401 || res.status === 403) {
      handleAuthFailure('Invalid token. Please log in again.');
      return;
    }

    if (!res.ok) {
      throw new Error('Failed to load community feed');
    }

    const posts = await res.json();
    const arr = Array.isArray(posts) ? posts : [];

    if (arr.length === 0) {
      list.innerHTML = `<div class="empty-state"><i class="fas fa-comments"></i><p>No community posts tagged to your organisation yet.</p></div>`;
      return;
    }

    list.innerHTML = '';
    arr.forEach((p) => {
      const username = escapeHtml(p.username || 'Volunteer');
      const created = p.createdat ? new Date(p.createdat).toLocaleString() : '';
      const content = escapeHtml(p.content || '');
      const comments = Array.isArray(p.comments) ? p.comments : [];

      const commentsHtml = comments.slice(-2).map((c) => {
        const cu = escapeHtml(c.username || 'User');
        const ct = escapeHtml(c.commenttext || c.CommentText || '');
        return `
          <div class="community-comment">
            <div class="community-comment__text"><span class="community-comment__user">${cu}</span>: ${ct}</div>
          </div>
        `;
      }).join('');

      const el = document.createElement('div');
      el.className = 'community-post';
      el.innerHTML = `
        <div class="community-post__meta">
          <div class="community-post__user">${username}</div>
          <div class="community-post__time">${created}</div>
        </div>
        <div class="community-post__content">${content}</div>
        ${commentsHtml ? `<div class="community-post__comments">${commentsHtml}</div>` : ''}
      `;
      list.appendChild(el);
    });
  } catch (e) {
    console.error('Error loading institution community feed:', e);
    list.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Unable to load community feed.</p></div>`;
  }
}

// Organization ID will be fetched on page load
let organizationId = null;

let allEventsCache = [];
let currentEventFilter = "all";
let eventsVisibleCount = 0;
const EVENTS_PAGE_SIZE = 6;

const API_BASE = 'https://fsdp-cycling-ltey.onrender.com';

function handleAuthFailure(message = 'Session expired. Please log in again.') {
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
  } catch {
    // ignore
  }
  alert(message);
  window.location.href = "../../index.html";
}


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

const membersGrid = document.getElementById('membersGrid');

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

    if (response.status === 401 || response.status === 403) {
      handleAuthFailure('Invalid token. Please log in again.');
      return null;
    }

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
    currentEventFilter = filter;
    const response = await fetch(`${API_BASE}/institution/events/all`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 401 || response.status === 403) {
      handleAuthFailure('Invalid token. Please log in again.');
      return;
    }

    if (!response.ok) {
      throw new Error("Failed to load events");
    }

    const events = await response.json();
    allEventsCache = Array.isArray(events) ? events : [];
    eventGrid.innerHTML = "";

    if (!Array.isArray(events) || events.length === 0) {
      eventGrid.innerHTML = `<p style="text-align:center;color:#777;">No events found.</p>`;
      const loadMoreWrap = document.getElementById('events-load-more-wrap');
      if (loadMoreWrap) loadMoreWrap.style.display = 'none';
      return;
    }

    const filteredEvents = getFilteredEventsFromCache(filter);

    // Update count badge
    const countBadge = document.getElementById('events-count');
    if (countBadge) countBadge.textContent = filteredEvents.length;

    if (filteredEvents.length === 0) {
      eventGrid.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-calendar-times"></i>
          <p>No events found for this filter.</p>
        </div>
      `;
      const loadMoreWrap = document.getElementById('events-load-more-wrap');
      if (loadMoreWrap) loadMoreWrap.style.display = 'none';
      return;
    }

    eventsVisibleCount = 0;
    renderMoreEvents(filteredEvents);

  } catch (err) {
    console.error("Error loading events:", err);
    eventGrid.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Unable to load events. Please try again.</p>
      </div>
    `;
    const loadMoreWrap = document.getElementById('events-load-more-wrap');
    if (loadMoreWrap) loadMoreWrap.style.display = 'none';
  }
}

function getFilteredEventsFromCache(filter) {
  let filteredEvents = allEventsCache;
  const currentDate = new Date();

  if (filter === "assigned") {
    filteredEvents = allEventsCache.filter(ev => ev.organizationid !== null);
  } else if (filter === "not_assigned") {
    filteredEvents = allEventsCache.filter(ev => ev.organizationid === null);
  } else if (filter === "expired") {
    filteredEvents = allEventsCache.filter(ev => new Date(ev.eventdate) < currentDate);
  }

  return filteredEvents;
}

function renderMoreEvents(filteredEvents) {
  const loadMoreWrap = document.getElementById('events-load-more-wrap');
  const loadMoreBtn = document.getElementById('events-load-more');
  if (!loadMoreWrap || !loadMoreBtn) return;

  const nextChunk = filteredEvents.slice(eventsVisibleCount, eventsVisibleCount + EVENTS_PAGE_SIZE);
  nextChunk.forEach(event => {
    const card = createEventCard(event);
    eventGrid.appendChild(card);
  });
  eventsVisibleCount += nextChunk.length;

  loadMoreWrap.style.display = eventsVisibleCount < filteredEvents.length ? 'flex' : 'none';
}

document.addEventListener('click', (e) => {
  const loadMoreBtn = document.getElementById('events-load-more');
  if (!loadMoreBtn) return;
  if (e.target === loadMoreBtn || loadMoreBtn.contains(e.target)) {
    const filtered = getFilteredEventsFromCache(currentEventFilter);
    renderMoreEvents(filtered);
  }
});

// Load my applications (pending bookings)
async function loadMyApplications() {
  

  if (!organizationId) {
    organizationId = await getOrganizationId();
  }

  try {
    const response = await fetch(`${API_BASE}/organization/events/my-requests`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      let msg = "Failed to load applications";
      try {
        const data = await response.json();
        msg = data?.message || data?.error || msg;
      } catch {
        try {
          const text = await response.text();
          if (text) msg = text;
        } catch {
          // ignore
        }
      }
      throw new Error(msg);
    }

    const applications = await response.json();
    applicationsGrid.innerHTML = "";

    // Filter to show only pending applications
    const pendingApplications = applications.filter(app => app.status === 'Pending');

    // Update count badge
    const countBadge = document.getElementById('applications-count');
    if (countBadge) countBadge.textContent = pendingApplications.length;

    if (pendingApplications.length === 0) {
      applicationsGrid.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-inbox"></i>
          <p>No pending applications. Browse available events to apply!</p>
        </div>
      `;
      return;
    }

    pendingApplications.forEach(app => {
      const card = createApplicationCard(app);
      applicationsGrid.appendChild(card);
    });

  } catch (err) {
    console.error("Error loading applications:", err);
    const fallback = (!organizationId)
      ? 'You are not associated with an organization yet.'
      : 'Unable to load applications.';
    applicationsGrid.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-circle"></i>
        <p>${err?.message || fallback}</p>
      </div>
    `;
  }
}

// Load approved applications
async function loadApprovedApplications() {
  if (!organizationId) {
    organizationId = await getOrganizationId();
  }

  try {
    const response = await fetch(`${API_BASE}/organization/events/my-requests`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      let msg = "Failed to load approved applications";
      try {
        const data = await response.json();
        msg = data?.message || data?.error || msg;
      } catch {
        try {
          const text = await response.text();
          if (text) msg = text;
        } catch {
          // ignore
        }
      }
      throw new Error(msg);
    }

    const applications = await response.json();
    approvedGrid.innerHTML = "";

    // Filter to show only approved applications
    const approvedApplications = applications.filter(app => app.status === 'Approved');

    // Update count badge
    const countBadge = document.getElementById('approved-count');
    if (countBadge) countBadge.textContent = approvedApplications.length;

    if (approvedApplications.length === 0) {
      approvedGrid.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-calendar-check"></i>
          <p>No approved events yet. Your applications will appear here once approved.</p>
        </div>
      `;
      return;
    }

    approvedApplications.forEach(app => {
      const card = createApprovedApplicationCard(app);
      approvedGrid.appendChild(card);
    });

  } catch (err) {
    console.error("Error loading approved applications:", err);
    const fallback = (!organizationId)
      ? 'You are not associated with an organization yet.'
      : 'Unable to load approved applications.';
    approvedGrid.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-circle"></i>
        <p>${err?.message || fallback}</p>
      </div>
    `;
  }
}

// Create event card
function createEventCard(event) {
  const card = document.createElement("div");
  card.classList.add("event-card2");
  card.style.cursor = "pointer";

  const eventDate = event.eventdate || event.EventDate;
  const formattedDate = eventDate ? new Date(eventDate).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : 'Date TBD';
  const eventName = event.eventname || event.EventName || 'Untitled Event';
  const location = event.location || event.Location || 'Location TBD';
  const requiredVolunteers = event.requiredvolunteers || event.RequiredVolunteers || 0;
  const eventImage = event.eventimage || event.EventImage;
  const isAssigned = event.organizationid !== null;

  const imageStyle = eventImage 
    ? `background-image: url('${eventImage}'); background-size: cover; background-position: center;`
    : `background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 3rem;`;

  card.innerHTML = `
    <div class="event-img" style="${imageStyle}">
      ${!eventImage ? '🚴' : ''}
    </div>
    <div class="event-info">
      <h3>${eventName}</h3>
      <p><i class="fas fa-calendar"></i> ${formattedDate}</p>
      <p><i class="fas fa-map-marker-alt"></i> ${location}</p>
      <p><i class="fas fa-users"></i> ${requiredVolunteers} volunteers needed</p>
      <span class="status-tag ${isAssigned ? 'status-assigned' : 'status-available'}">
        ${isAssigned ? '<i class="fas fa-check"></i> Assigned' : '<i class="fas fa-clock"></i> Available'}
      </span>
    </div>
  `;

  card.addEventListener("click", () => {
     console.log("clicked origin=", location.origin);
  localStorage.setItem("currentEvent", JSON.stringify(event));
  console.log("saved currentEvent=", localStorage.getItem("currentEvent"));
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
  const formattedDate = eventDate ? new Date(eventDate).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : 'Date TBD';
  const requiredVolunteers = application.requiredvolunteers ?? application.RequiredVolunteers;
  const location = application.location || application.Location || 'Location TBD';

  card.innerHTML = `
    <div class="event-img" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 3rem;">
      <i class="fas fa-hourglass-half"></i>
    </div>
    <div class="event-info">
      <h3>${eventName}</h3>
      <p><i class="fas fa-calendar"></i> ${formattedDate}</p>
      <p><i class="fas fa-map-marker-alt"></i> ${location}</p>
      ${typeof requiredVolunteers === 'number' ? `<p><i class="fas fa-users"></i> ${requiredVolunteers} volunteers needed</p>` : ''}
      <span class="status-tag status-pending">
        <i class="fas fa-clock"></i> Pending Approval
      </span>
    </div>
  `;

  card.addEventListener("click", () => {
    localStorage.setItem("currentApplication", JSON.stringify(application));
    localStorage.removeItem("currentEvent");
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
  const formattedDate = eventDate ? new Date(eventDate).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : 'Date TBD';
  const requiredVolunteers = application.requiredvolunteers ?? application.RequiredVolunteers;
  const location = application.location || application.Location || 'Location TBD';
  const hasEventHead = application.session_head_name || application.SessionHeadName;

  card.innerHTML = `
    <div class="event-img" style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 3rem;">
      <i class="fas fa-check-circle"></i>
    </div>
    <div class="event-info">
      <h3>${eventName}</h3>
      <p><i class="fas fa-calendar"></i> ${formattedDate}</p>
      <p><i class="fas fa-map-marker-alt"></i> ${location}</p>
      ${typeof requiredVolunteers === 'number' ? `<p><i class="fas fa-users"></i> ${requiredVolunteers} volunteers needed</p>` : ''}
      <span class="status-tag status-approved">
        <i class="fas fa-check"></i> Approved
      </span>
      ${!hasEventHead ? '<span class="status-tag status-pending" style="margin-left: 8px;"><i class="fas fa-user-plus"></i> Needs Event Head</span>' : ''}
    </div>
  `;

  card.addEventListener("click", () => {
    localStorage.setItem("currentApplication", JSON.stringify(application));
    localStorage.removeItem("currentEvent");
    window.location.href = "./institution_event_detail.html";
  });

  return card;
}

// Toggle collapsible sections
function toggleSection(sectionName) {
  const header = document.getElementById(`${sectionName}-section-header`);
  const content = document.getElementById(`${sectionName}-content`);
  
  if (header && content) {
    header.classList.toggle('collapsed');
    content.classList.toggle('collapsed');
  }
}

// Make toggleSection globally available
window.toggleSection = toggleSection;

// Initialize on page load
document.addEventListener("DOMContentLoaded", async () => {
  try {
    organizationId = await getOrganizationId();
    if (!organizationId) {
      console.warn("No organization ID found. Some features may be limited.");
    }
    loadAllEvents("all");
    loadOrganizationMembersExperience();
    loadInstitutionCommunityFeed();
  } catch (error) {
    console.error("Error initializing page:", error);
    loadAllEvents("all");
    loadOrganizationMembersExperience();
    loadInstitutionCommunityFeed();
  }
});

