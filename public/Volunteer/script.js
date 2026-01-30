const eventList = document.getElementById('eventList');
const EVENTS_ENDPOINT = `https://fsdp-cycling-ltey.onrender.com/volunteer/events`;
const SIGNED_EVENTS_ENDPOINT = `https://fsdp-cycling-ltey.onrender.com/volunteer/signed-events`;
const FRIEND_SIGNUP_EVENTS_ENDPOINT = `https://fsdp-cycling-ltey.onrender.com/volunteer/friends/signup-events`;

let allEvents = [];
let signedEventIds = new Set();
let friendSignedEventIds = null;
let activeFilter = 'all';

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
  if (text) text.textContent = 'New event available! Please refresh or browse below.';

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

document.addEventListener('DOMContentLoaded', () => {
  bindFilterButtons();
  loadEvents();
});

function showEventSkeleton(count = 4) {
  if (!eventList) return;
  eventList.innerHTML = '';
  for (let i = 0; i < count; i += 1) {
    const sk = document.createElement('div');
    sk.className = 'event-skeleton';
    sk.setAttribute('aria-hidden', 'true');
    sk.innerHTML = `
      <div class="evsk-hero"></div>
      <div class="evsk-body">
        <div class="evsk-line evsk-line--title"></div>
        <div class="evsk-line"></div>
        <div class="evsk-line"></div>
        <div class="evsk-actions">
          <div class="evsk-pill"></div>
        </div>
      </div>
    `;
    eventList.appendChild(sk);
  }
}

function bindFilterButtons() {
  document.querySelectorAll('.event-filter-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const filter = btn.dataset.filter;
      await applyFilter(filter);
    });
  });
}

async function loadEvents() {
  showEventSkeleton(4);

  try {
    const response = await fetch(EVENTS_ENDPOINT);

    if (!response.ok) {
      throw new Error(`Failed to fetch events (${response.status})`);
    }

    const events = await response.json();
    allEvents = Array.isArray(events) ? events : [];

    handleNewEventNotification(allEvents);

    signedEventIds = await fetchSignedUpEventIds();

    if (!Array.isArray(allEvents) || allEvents.length === 0) {
      setStatusMessage(
        'empty',
        'No events available for sign up at the moment. Please check back later!'
      );
      return;
    }

    await applyFilter('all');

  } catch (error) {
    console.error('Error loading events:', error);
    setStatusMessage(
      'error',
      'Failed to load events. Please check your network or try again later.'
    );
  }
}

async function fetchSignedUpEventIds() {
  const token = localStorage.getItem('token');
  if (!token) return new Set();

  try {
    const response = await fetch(SIGNED_EVENTS_ENDPOINT, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return new Set();
    }

    const signedEvents = await response.json();
    if (!Array.isArray(signedEvents)) return new Set();

    const ids = new Set();
    signedEvents.forEach(e => {
      const id = e.eventid ?? e.EventId ?? e.eventId;
      if (id != null) ids.add(String(id));
    });
    return ids;
  } catch (e) {
    return new Set();
  }
}

async function fetchFriendSignedEventIds() {
  if (friendSignedEventIds) return friendSignedEventIds;

  const token = localStorage.getItem('token');
  if (!token) {
    friendSignedEventIds = new Set();
    return friendSignedEventIds;
  }

  try {
    const response = await fetch(FRIEND_SIGNUP_EVENTS_ENDPOINT, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      friendSignedEventIds = new Set();
      return friendSignedEventIds;
    }

    const friends = await response.json();
    const ids = new Set();

    if (Array.isArray(friends)) {
      friends.forEach(f => {
        (f.events || []).forEach(e => {
          if (e.eventid != null) ids.add(String(e.eventid));
        });
      });
    }

    friendSignedEventIds = ids;
    return friendSignedEventIds;
  } catch (e) {
    friendSignedEventIds = new Set();
    return friendSignedEventIds;
  }
}

function setActiveFilterButton(filter) {
  document.querySelectorAll('.event-filter-btn').forEach(b => {
    const isActive = b.dataset.filter === filter;
    b.classList.toggle('active', isActive);
    b.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
}

async function applyFilter(filter) {
  activeFilter = filter;
  setActiveFilterButton(filter);

  showEventSkeleton(4);

  if (!Array.isArray(allEvents) || allEvents.length === 0) {
    setStatusMessage('empty', 'No events available.');
    return;
  }

  let filtered = [...allEvents];

  if (filter === 'latest') {
    filtered.sort((a, b) => new Date(b.eventdate).getTime() - new Date(a.eventdate).getTime());
  }

  if (filter === 'weekend') {
    filtered = filtered.filter(e => {
      const d = new Date(e.eventdate);
      const day = d.getDay();
      return day === 0 || day === 6;
    });
  }

  if (filter === 'near') {
    const coords = await getUserCoords();
    if (!coords) {
      setStatusMessage('empty', 'Please allow location access to use “Near my house”.');
      return;
    }

    const withDistance = filtered
      .filter(e => e.latitude && e.longitude)
      .map(e => ({
        ...e,
        _distanceKm: getDistance(coords.lat, coords.lng, e.latitude, e.longitude)
      }))
      .sort((a, b) => a._distanceKm - b._distanceKm);

    if (withDistance.length === 0) {
      setStatusMessage('empty', 'No events have location coordinates available for distance sorting.');
      return;
    }

    filtered = withDistance;
  }

  if (filter === 'friends') {
    const friendIds = await fetchFriendSignedEventIds();
    filtered = filtered.filter(e => friendIds.has(String(e.eventid)));

    if (filtered.length === 0) {
      setStatusMessage('empty', 'No events found that your friends signed up for.');
      return;
    }
  }

  renderEvents(filtered);
}

function renderEvents(events) {
  eventList.innerHTML = '';

  events.forEach(event => {
    const card = document.createElement('div');
    card.classList.add('event-card');

    const title = event.eventname || 'Untitled Event';
    const date = formatDate(event.eventdate);
    const description = event.description || 'No description available.';
    const location = event.location || 'Location TBD';
    const required = event.requiredvolunteers
      ? `Required Volunteers: ${event.requiredvolunteers}`
      : '';

    const participantCount =
      event.participantCount ??
      event.participantcount ??
      event.participants ??
      event.signupCount ??
      event.signupcount ??
      event.currentvolunteers ??
      event.currentVolunteers ??
      event.volunteersSigned ??
      event.volunteerssigned;

    const eventId = event.eventid;
    const isSignedUp = signedEventIds.has(String(eventId));
    const distanceText = event._distanceKm != null ? `<p><strong>Distance:</strong> ${event._distanceKm.toFixed(1)} km</p>` : '';
    const eventImage = event.eventimage || event.EventImage || event.eventImage;
    const defaultImg = 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=400&h=250&fit=crop';
    const eventImageHtml = eventImage && eventImage.trim() !== ''
      ? `<div class="event-card-image"><img src="${eventImage.replace(/"/g, '&quot;')}" alt="${(title || 'Event').replace(/"/g, '&quot;')}" onerror="this.onerror=null;this.src='${defaultImg}'"></div>`
      : '';

    card.innerHTML = `
      ${eventImageHtml}
      <div class="event-details" role="button" tabindex="0" data-event-id="${eventId}">
        <button class="event-collapse-btn" type="button" aria-label="Hide this event">×</button>

        <div class="event-body">
          <h3>${title}</h3>
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Location:</strong> ${location}</p>
          ${distanceText}
          <p>${description}</p>
          ${Number.isFinite(Number(participantCount)) ? `<p><strong>Participants signed up:</strong> ${Number(participantCount)}</p>` : ''}
          ${required ? `<p>${required}</p>` : ''}
          <div class="event-actions"></div>
          <div class="signup-feedback" aria-live="polite"></div>
        </div>
      </div>
    `;

    const actions = card.querySelector('.event-actions');

    const details = card.querySelector('.event-details');
    details.addEventListener('click', () => openEventDetail(eventId));
    details.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openEventDetail(eventId);
      }
    });

    const collapseBtn = card.querySelector('.event-collapse-btn');
    if (collapseBtn) {
      collapseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        card.classList.add('is-dismissed');

        const removeTimer = setTimeout(() => {
          card.remove();
        }, 260);

        card.addEventListener('transitionend', () => {
          clearTimeout(removeTimer);
          card.remove();
        }, { once: true });
      });
    }

    const button = document.createElement('button');
    button.classList.add('signup-btn');
    button.type = 'button';
    button.textContent = isSignedUp ? 'Signed Up' : 'Sign Up';
    button.disabled = isSignedUp;

    button.addEventListener('click', (e) => {
      e.stopPropagation();
      if (isSignedUp) return;
      signUp(title, eventId, button, card);
    });

    actions.appendChild(button);
    eventList.appendChild(card);
  });
}

function openEventDetail(eventId) {
  window.location.href = `./volunteer_event_detail.html?eventId=${eventId}`;
}

async function getUserCoords() {
  const storedLat = parseFloat(localStorage.getItem('userLat'));
  const storedLng = parseFloat(localStorage.getItem('userLng'));
  if (!Number.isNaN(storedLat) && !Number.isNaN(storedLng)) {
    return { lat: storedLat, lng: storedLng };
  }

  if (!navigator.geolocation) return null;

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        localStorage.setItem('userLat', String(lat));
        localStorage.setItem('userLng', String(lng));
        resolve({ lat, lng });
      },
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });
}

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function setStatusMessage(type, message) {
  eventList.innerHTML = `
    <div class="event-message event-message--${type}">
      ${message}
    </div>
  `;
}

function formatDate(rawDate) {
  if (!rawDate) return 'Date TBD';

  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) return rawDate;

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function ensureCongratsOverlay() {
  if (document.getElementById('hvCongrats')) return;

  const wrap = document.createElement('div');
  wrap.id = 'hvCongrats';
  wrap.className = 'hv-congrats';
  wrap.innerHTML = `
    <div class="hv-congrats__backdrop" data-close="true"></div>
    <div class="hv-congrats__dialog" role="dialog" aria-modal="true" aria-label="Congratulations">
      <div class="hv-confetti" aria-hidden="true"></div>
      <div class="hv-congrats__body">
        <div class="hv-congrats__icon" aria-hidden="true">✓</div>
        <h3 class="hv-congrats__title" id="hvCongratsTitle">Congratulations!</h3>
        <p class="hv-congrats__msg" id="hvCongratsMsg"></p>
      </div>
      <div class="hv-congrats__footer">
        <button class="hv-congrats__btn" type="button" id="hvCongratsOk">OK</button>
      </div>
    </div>
  `;

  document.body.appendChild(wrap);

  const close = () => wrap.classList.remove('is-open');
  wrap.addEventListener('click', (e) => {
    if (e.target?.dataset?.close === 'true') close();
  });
  const ok = wrap.querySelector('#hvCongratsOk');
  if (ok) ok.addEventListener('click', close);
}

function launchConfetti(container) {
  if (!container) return;
  container.innerHTML = '';
  const colors = ['#ea8d2a', '#16a34a', '#2563eb', '#dc2626', '#0f172a', '#f59e0b'];
  const pieces = 28;
  for (let i = 0; i < pieces; i += 1) {
    const el = document.createElement('i');
    const left = Math.random() * 100;
    const delay = Math.random() * 120;
    const duration = 700 + Math.random() * 600;
    const rotate = Math.floor(Math.random() * 360);
    const w = 8 + Math.random() * 8;
    const h = 10 + Math.random() * 12;
    el.style.left = `${left}%`;
    el.style.background = colors[i % colors.length];
    el.style.width = `${w}px`;
    el.style.height = `${h}px`;
    el.style.transform = `translateY(-10px) rotate(${rotate}deg)`;
    el.style.animationDelay = `${delay}ms`;
    el.style.animationDuration = `${duration}ms`;
    container.appendChild(el);
  }
}

function showCongrats(message) {
  ensureCongratsOverlay();
  const wrap = document.getElementById('hvCongrats');
  if (!wrap) return;
  const msg = wrap.querySelector('#hvCongratsMsg');
  if (msg) msg.textContent = message || '';
  const confetti = wrap.querySelector('.hv-confetti');
  launchConfetti(confetti);
  wrap.classList.add('is-open');

  window.clearTimeout(wrap._autoCloseTimer);
  wrap._autoCloseTimer = window.setTimeout(() => {
    wrap.classList.remove('is-open');
  }, 2400);
}

async function signUp(eventTitle, eventId, buttonEl, cardEl) {
  const token = localStorage.getItem('token');

  if (!token) {
    alert('Please login first');
    window.location.href = '../../index.html';
    return;
  }

  if (buttonEl) {
    buttonEl.disabled = true;
    buttonEl.classList.add('is-loading');
    buttonEl.dataset.originalText = buttonEl.textContent;
    buttonEl.textContent = 'Signing up...';
  }

  if (cardEl) {
    const feedback = cardEl.querySelector('.signup-feedback');
    if (feedback) {
      feedback.textContent = '';
      feedback.classList.remove('is-success', 'is-error');
    }
  }

  try {
    const response = await fetch(
      `https://fsdp-cycling-ltey.onrender.com/events/signup`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ eventId }) 
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Signup failed');
    }

    signedEventIds.add(String(eventId));

    if (cardEl) {
      const feedback = cardEl.querySelector('.signup-feedback');
      if (feedback) {
        feedback.textContent = 'Sign up successfully.';
        feedback.classList.add('is-success');
      }
    }

    if (buttonEl) {
      buttonEl.classList.remove('is-loading');
      buttonEl.textContent = 'Signed Up';
      buttonEl.disabled = true;
    }

    showCongrats(`You signed up successfully for "${eventTitle}".`);

    setTimeout(() => {
      const feedback = cardEl?.querySelector('.signup-feedback');
      if (feedback) feedback.textContent = '';
    }, 5000);

  } catch (error) {
    console.error('Signup error:', error);

    if (buttonEl) {
      buttonEl.classList.remove('is-loading');
      buttonEl.disabled = false;
      buttonEl.textContent = buttonEl.dataset.originalText || 'Sign Up';
    }

    if (cardEl) {
      const feedback = cardEl.querySelector('.signup-feedback');
      if (feedback) {
        feedback.textContent = 'Failed to sign up.';
        feedback.classList.add('is-error');
      }
    }

    if (error.message?.includes('already')) {
      alert('You already signed up for this event.');
    } else {
      alert('Failed to sign up.');
    }
  }
}

