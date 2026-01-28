const API_BASE = window.location.origin;

const token = localStorage.getItem('token');
if (!token) {
  alert('Please log in first');
  window.location.href = '../../index.html';
}

const params = new URLSearchParams(window.location.search);
const friendId = params.get('friendId');
const friendName = params.get('friendName');

const titleEl = document.getElementById('friendEventsTitle');
const subtitleEl = document.getElementById('friendEventsSubtitle');
const eventList = document.getElementById('eventList');
const viewProfileBtn = document.getElementById('viewProfileBtn');

if (!friendId) {
  alert('Missing friendId');
  window.location.href = './homepage_login_volunteer.html';
}

if (titleEl) {
  titleEl.textContent = friendName ? `${friendName}'s Signed Up Events` : `Friend's Signed Up Events`;
}
if (subtitleEl) {
  subtitleEl.textContent = 'All events this volunteer has signed up for.';
}

if (viewProfileBtn) {
  viewProfileBtn.addEventListener('click', () => {
    window.location.href = `./userProfile.html?userId=${encodeURIComponent(friendId)}`;
  });
}

function setStatusMessage(type, message) {
  if (!eventList) return;
  eventList.innerHTML = `
    <div class="event-message event-message--${type}">
      ${message}
    </div>
  `;
}

function formatDate(rawDate) {
  if (!rawDate) return 'Date TBD';
  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) return String(rawDate);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getStatusBadge(eventStatus, signUpStatus) {
  let badgeClass = 'status-badge';
  let badgeText = '';

  if (signUpStatus === 'Cancelled') {
    badgeClass += ' status-badge--cancelled';
    badgeText = 'Cancelled';
  } else if (eventStatus === 'Completed') {
    badgeClass += ' status-badge--completed';
    badgeText = 'Completed';
  } else if (eventStatus === 'Ongoing') {
    badgeClass += ' status-badge--ongoing';
    badgeText = 'Ongoing';
  } else if (eventStatus === 'Cancelled') {
    badgeClass += ' status-badge--cancelled';
    badgeText = 'Cancelled';
  } else {
    badgeClass += ' status-badge--upcoming';
    badgeText = 'Upcoming';
  }

  return `<span class="${badgeClass}">${badgeText}</span>`;
}

async function loadFriendSignedEvents() {
  setStatusMessage('loading', 'Loading signed up events...');

  try {
    const res = await fetch(`${API_BASE}/volunteer/user/profile/${encodeURIComponent(friendId)}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      if (res.status === 401) {
        alert('Login expired, please login again');
        window.location.href = '../../index.html';
        return;
      }
      throw new Error(`Failed to load profile (${res.status})`);
    }

    const data = await res.json();

    const profile = data?.user || data;
    const events = Array.isArray(profile?.events) ? profile.events : [];

    const displayName = profile?.name || friendName;
    if (titleEl && displayName) {
      titleEl.textContent = `${displayName}'s Signed Up Events`;
    }

    if (!events.length) {
      setStatusMessage('empty', 'This volunteer has not signed up for any events yet.');
      return;
    }

    eventList.innerHTML = '';

    events.forEach((event) => {
      const card = document.createElement('div');
      card.classList.add('event-card', 'signed-event-card');

      const title = event.eventname || event.EventName || 'Untitled Event';
      const date = formatDate(event.eventdate || event.EventDate);
      const description = event.description || event.Description || 'No description available.';
      const location = event.location || event.EventLocation || 'Location TBD';

      const eventStatus = event.status || event.event_status || event.EventStatus || 'Upcoming';
      const signUpStatus = event.signup_status || event.signupstatus || event.SignUpStatus || 'Active';
      const signupDate = formatDate(event.signup_date || event.signupdate || event.SignUpDate);

      const statusBadge = getStatusBadge(eventStatus, signUpStatus);

      card.innerHTML = `
        <div class="event-details">
          ${statusBadge}
          <h3>${title}</h3>
          <p><strong>Event Date:</strong> ${date}</p>
          <p><strong>Location:</strong> ${location}</p>
          <p>${description}</p>
          <p class="signup-info"><strong>Sign Up Date:</strong> ${signupDate}</p>
        </div>
      `;

      card.addEventListener('click', () => {
        const eventId = event.eventid ?? event.EventID ?? event.id;
        if (!eventId) return;
        window.location.href = `./volunteer_event_detail.html?id=${encodeURIComponent(eventId)}`;
      });

      eventList.appendChild(card);
    });
  } catch (e) {
    console.error('[friend-signed-events] load error:', e);
    setStatusMessage('error', 'Failed to load events. Please try again later.');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadFriendSignedEvents();
});
