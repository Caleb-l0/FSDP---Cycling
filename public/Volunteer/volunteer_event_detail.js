const token = localStorage.getItem("token");
if (!token) {
  alert("Please log in first");
  window.location.href = "../../index.html";
}

const API_BASE = window.location.origin;

let signedUp = false;

let currentEventLat = null;
let currentEventLng = null;
let currentEventAddress = '';

let currentEventName = '';
let currentEventDate = '';

let currentEventLocation = '';


// Get eventId
const params = new URLSearchParams(window.location.search);
const eventId = params.get("eventId");

if (!eventId) {
  alert("Invalid event ID");
  window.location.href = "./homepage_login_volunteer.html";
}

document.addEventListener("DOMContentLoaded", () => {
  loadEventDetails(eventId);
  checkIsSignedUp(eventId);
});

// ===========================
// LOAD EVENT DETAILS
// ===========================
async function loadEventDetails(id) {
  try {
    const res = await fetch(
      `${API_BASE}/volunteer/events/${id}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );


    if (!res.ok) throw new Error("Failed to load event");
    const data = await res.json();
    currentEventName = data.eventname || '';
    currentEventDate = data.eventdate || '';
    currentEventLocation = data.location || '';
    document.getElementById("req-name").textContent = data.eventname;
    document.getElementById("req-org").textContent = data.organizationid || "-";
    document.getElementById("req-date").textContent =
      new Date(data.eventdate).toLocaleString();
      setEventStatus(data.eventdate);
    document.getElementById("req-status").textContent = data.status;
     document.getElementById("req-people-num").textContent = data.maximumparticipant;
    document.getElementById("req-loc").textContent = data.location;
    currentEventLat = Number(data.latitude);
    currentEventLng = Number(data.longitude);
    currentEventAddress = data.location || '';
    document.getElementById("req-needed").textContent = data.requiredvolunteers;
    document.getElementById("req-created").textContent = data.createdat
      ? new Date(data.createdat).toLocaleString()
      : "-";
    document.getElementById("req-desc").textContent = data.description || "-";

    const eventImage = data.eventImage || data.eventimage || data.EventImage;
    const defaultEventImg = "https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=900&h=500&fit=crop";
    const reqImg = document.getElementById("req-img");
    if (reqImg) {
      reqImg.src = eventImage && eventImage.trim() !== ""
        ? eventImage
        : defaultEventImg;
      reqImg.alt = (data.eventname || "Event") + " image";
      reqImg.onerror = function () {
        this.onerror = null;
        this.src = defaultEventImg;
      };
    }

    const headWrap = document.getElementById('event-head');
    const headContent = document.getElementById('event-head-content');
    if (headWrap && headContent) {
      const headName = data.session_head_name || data.sessionHeadName;
      const headEmail = data.session_head_email || data.sessionHeadEmail;
      const headContact = data.session_head_contact || data.sessionHeadContact;
      const headProfile = data.session_head_profile || data.sessionHeadProfile;
      const headUserId = data.eventheaduserid || data.eventHeadUserId;

      if (headName) {
        headWrap.style.display = 'block';
        const initials = String(headName).trim().split(/\s+/).map(s => s[0]).join('').slice(0, 2).toUpperCase();
        const href = headUserId ? `../Profile/profilepage.html?userId=${encodeURIComponent(headUserId)}` : '';
        headContent.innerHTML = `
          <div class="event-head-card" ${href ? `role=\"button\" tabindex=\"0\"` : ''}>
            <div class="event-head-avatar">${initials || 'EH'}</div>
            <div class="event-head-meta">
              <div class="event-head-name">${headName}</div>
              <div class="event-head-sub">
                ${headEmail ? `<div><i class=\"fas fa-envelope\"></i> <a href=\"mailto:${headEmail}\">${headEmail}</a></div>` : ''}
                ${headContact ? `<div><i class=\"fas fa-phone\"></i> <a href=\"tel:${headContact}\">${headContact}</a></div>` : ''}
                ${headProfile ? `<div><i class=\"fas fa-user\"></i> <span>${headProfile}</span></div>` : ''}
                ${href ? `<div><i class=\"fas fa-id-card\"></i> <span>View profile</span></div>` : ''}
              </div>
            </div>
          </div>
        `;

        if (href) {
          const card = headContent.querySelector('.event-head-card');
          if (card) {
            card.addEventListener('click', () => { window.location.href = href; });
            card.addEventListener('keydown', (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                window.location.href = href;
              }
            });
          }
        }
      } else {
        headWrap.style.display = 'none';
      }
    }
     
  

  } catch (err) {
    console.error(err);
    alert("Unable to load event details");
  }
}

function buildSharePayload() {
  const title = currentEventName || 'Volunteer Event';
  const dateText = currentEventDate ? new Date(currentEventDate).toLocaleString() : '';
  const locationText = currentEventLocation || currentEventAddress || '';
  const url = `${window.location.origin}${window.location.pathname}?eventId=${encodeURIComponent(eventId)}`;
  const lines = [
    `Event: ${title}`,
    dateText ? `Date: ${dateText}` : '',
    locationText ? `Location: ${locationText}` : '',
    `Link: ${url}`,
    'Let’s join together!'
  ].filter(Boolean);
  return { title, url, text: lines.join('\n') };
}

async function copyShareText() {
  const payload = buildSharePayload();
  try {
    await navigator.clipboard.writeText(payload.text);
    alert('Event info copied. You can paste it into WhatsApp to share.');
  } catch {
    prompt('Copy this event info:', payload.text);
  }
}

function sanitizePhoneForWhatsApp(phone) {
  const raw = String(phone || '').trim();
  return raw ? raw.replace(/[^\d]/g, '') : '';
}

let hvShareFriendsLoaded = false;

async function loadFriendsForShare() {
  const listEl = document.getElementById('hvShareFriends');
  const loadingEl = document.getElementById('hvShareFriendsLoading');
  if (!listEl) return;

  if (hvShareFriendsLoaded) return;
  hvShareFriendsLoaded = true;

  try {
    const res = await fetch(`${API_BASE}/volunteer/friends/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error('Failed to load friends');
    const friends = await res.json();

    if (loadingEl) loadingEl.remove();
    if (!Array.isArray(friends) || friends.length === 0) {
      listEl.innerHTML = '<div class="hv-share__loading">No friends found yet.</div>';
      return;
    }

    const payload = buildSharePayload();
    listEl.innerHTML = '';

    friends.slice(0, 12).forEach((f) => {
      const friendId = f.friendid ?? f.friendId ?? f.userid ?? f.userId ?? f.id;
      if (friendId == null) return;
      const name = f.nickname || f.name || 'Friend';
      const username = f.username ? `@${f.username}` : '';

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'hv-share__friend';
      btn.innerHTML = `<strong>${name}</strong><span>${username}</span>`;
      btn.addEventListener('click', () => {
        const target = `./friend_share_chat.html?friendId=${encodeURIComponent(friendId)}&eventId=${encodeURIComponent(eventId)}`;
        window.location.href = target;
      });

      listEl.appendChild(btn);
    });
  } catch (e) {
    if (loadingEl) loadingEl.textContent = 'Unable to load friends.';
  }
}

function openShareModal() {
  const modal = document.getElementById('hvShareModal');
  const step1 = document.getElementById('hvShareStep1');
  const step2 = document.getElementById('hvShareStep2');
  if (!modal) return;
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  if (step1) step1.style.display = 'block';
  if (step2) step2.style.display = 'none';
}

function closeShareModal() {
  const modal = document.getElementById('hvShareModal');
  if (!modal) return;
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
}

function showShareFriendPicker() {
  const step1 = document.getElementById('hvShareStep1');
  const step2 = document.getElementById('hvShareStep2');
  if (step1) step1.style.display = 'none';
  if (step2) step2.style.display = 'block';
  loadFriendsForShare();
}

function openGoogleMapsDirections({ lat, lng, address }) {
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
  const destination = hasCoords ? `${lat},${lng}` : (address || '').trim();
  if (!destination) {
    alert('Location is not available for this event.');
    return;
  }

  const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
  window.open(url, '_blank', 'noopener');
}

document.addEventListener('DOMContentLoaded', () => {
  const mapBtn = document.getElementById('btn-map');
  if (!mapBtn) return;
  mapBtn.addEventListener('click', () => {
    openGoogleMapsDirections({
      lat: currentEventLat,
      lng: currentEventLng,
      address: currentEventAddress
    });
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const shareBtn = document.getElementById('btn-share-event');
  if (!shareBtn) return;
  shareBtn.addEventListener('click', () => {
    openShareModal();
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('hvShareModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target?.dataset?.close === 'true') closeShareModal();
    });
  }

  const yes = document.getElementById('hvShareYes');
  if (yes) yes.addEventListener('click', showShareFriendPicker);

  const no = document.getElementById('hvShareNo');
  if (no) no.addEventListener('click', () => {
    copyShareText();
    closeShareModal();
  });

  const back = document.getElementById('hvShareBack');
  if (back) back.addEventListener('click', openShareModal);

  const closeBtn = document.getElementById('hvShareClose');
  if (closeBtn) closeBtn.addEventListener('click', closeShareModal);

  const phoneBtn = document.getElementById('hvSharePhoneBtn');
  if (phoneBtn) {
    phoneBtn.addEventListener('click', () => {
      const input = document.getElementById('hvSharePhone');
      const raw = input?.value || '';
      const waPhone = sanitizePhoneForWhatsApp(raw);
      const payload = buildSharePayload();
      if (!waPhone) return;
      const url = `https://wa.me/${waPhone}?text=${encodeURIComponent(payload.text)}`;
      window.open(url, '_blank', 'noopener');
    });
  }
});
// check assign

async function checkIsSignedUp(eventId) {
  try {
    const res = await fetch(
      `${API_BASE}/volunteer/events/isSignedUp/${eventId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    if (!res.ok) throw new Error();

    const data = await res.json();
    signedUp = data.signedUp;

    updateSignupButtonUI();

  } catch (err) {
    console.error("checkIsSignedUp failed", err);
  }
}



// ===========================
// BUTTON LOGIC
// ===========================
function setupButtons(eventData) {
  const btnSignup = document.getElementById("btn-signup");
  const btnCancel = document.getElementById("btn-cancel");

  if (eventData.usersignedup) {
    btnSignup.style.display = "none";
    btnCancel.style.display = "inline-block";
  } else {
    btnSignup.style.display = "inline-block";
    btnCancel.style.display = "none";
  }

  btnSignup.onclick = () =>
    signUp(eventData.eventname, eventData.eventid);

  btnCancel.onclick = () =>
    cancelSignUp(eventData.eventid);
}

// ===========================
// UPDATE SIGNUP BUTTON UI
// ===========================
function updateSignupButtonUI() {
  const btnSignup = document.getElementById("btn-signup");
  const btnCancelSignup = document.getElementById("btn-cancel-signup");

  if (signedUp) {
    btnSignup.style.display = "none";
    btnCancelSignup.style.display = "inline-block";

    btnCancelSignup.onclick = () => cancelSignUp(eventId);

  } else {
    btnSignup.style.display = "inline-block";
    btnCancelSignup.style.display = "none";

    btnSignup.onclick = () =>
      signUp(
        document.getElementById("req-name").textContent,
        eventId
      );
  }
}


// ===========================
// SIGN UP
// ===========================
async function signUp(eventName, eventId) {
  try {
    const res = await fetch(
      `${API_BASE}/volunteer/events/signup/${eventId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      }
    );

    if (!res.ok) throw new Error();

    alert(`You have signed up for "${eventName}"`);
    location.reload();

  } catch {
    alert("You already signed up or failed.");
  }
}

// ===========================
// CANCEL SIGN UP
// ===========================
async function cancelSignUp(eventId) {
  try {
    const res = await fetch(
      `${API_BASE}/volunteer/events/cancel/signup/${eventId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (!res.ok) throw new Error();

    alert("You have cancelled your sign-up.");
    location.reload();

  } catch {
    alert("Failed to cancel sign-up.");
  }
}



// event status display logic

function setEventStatus(eventDate) {
    const statusEl = document.getElementById("event-status");
    const statusText = statusEl.querySelector("span");
    const statusIcon = statusEl.querySelector("i");

    const now = new Date();
    const start = new Date(eventDate);

    // Default reset
    statusEl.className = "event-status";

    if (start > now) {
        // UPCOMING
        statusEl.classList.add("upcoming");
        statusIcon.className = "fas fa-clock";
        statusText.textContent = "Upcoming Event";
    } else {
        // If within same day → ongoing
        const diffHours = Math.abs(now - start) / (1000 * 60 * 60);

        if (diffHours <= 6) {
            statusEl.classList.add("ongoing");
            statusIcon.className = "fas fa-play-circle";
            statusText.textContent = "Ongoing Now";
        } else {
            statusEl.classList.add("expired");
            statusIcon.className = "fas fa-check-circle";
            statusText.textContent = "Event Ended";
        }
    }
}

