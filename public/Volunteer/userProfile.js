const UserEndPoint = `https://fsdp-cycling-ltey.onrender.com`;
const token = localStorage.getItem("token");
const userId = new URLSearchParams(window.location.search).get("userId");

if (!token) {
  window.location.href = "../../index.html";
}

/* =========================
   NAV SWITCH
========================= */
document.querySelectorAll(".hvop-nav-btn").forEach(btn => {
  btn.onclick = () => {
    document
      .querySelectorAll(".hvop-nav-btn, .hvop-panel")
      .forEach(el => el.classList.remove("active"));

    btn.classList.add("active");
    document.getElementById(btn.dataset.target).classList.add("active");
  };
});

/* =========================
   ADD FRIEND (UI ONLY)
========================= */
async function checkIfFriend() {
  try {
    const res = await fetch(`${UserEndPoint}/volunteer/friends/status/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const data = await res.json();

    setFriendUI(data.status);
    setPhoneVisibility(data.status === 'friends');
  }
  catch (err) {
    console.error("Check friend error", err);
  }
}

checkIfFriend();

const addBtn = document.getElementById("hvop-add-friend-btn");

const frModal = document.getElementById('hvop-fr-modal');
const frReason = document.getElementById('hvop-fr-reason');
const frError = document.getElementById('hvop-fr-error');
const frCancel = document.getElementById('hvop-fr-cancel');
const frSend = document.getElementById('hvop-fr-send');

const rmModal = document.getElementById('hvop-rm-modal');
const rmReason = document.getElementById('hvop-rm-reason');
const rmError = document.getElementById('hvop-rm-error');
const rmCancel = document.getElementById('hvop-rm-cancel');
const rmConfirm = document.getElementById('hvop-rm-confirm');

const toastEl = document.getElementById('hvop-toast');
let toastTimer;

function showToast(message) {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.add('is-show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.classList.remove('is-show');
  }, 2200);
}

function openFriendRequestModal() {
  if (!frModal) return;
  frModal.classList.add('is-open');
  frModal.setAttribute('aria-hidden', 'false');
  if (frError) {
    frError.style.display = 'none';
    frError.textContent = '';
  }
  if (frReason) frReason.value = '';
  setTimeout(() => frReason?.focus(), 0);
}

function closeFriendRequestModal() {
  if (!frModal) return;
  frModal.classList.remove('is-open');
  frModal.setAttribute('aria-hidden', 'true');
}

function showFriendRequestError(message) {
  if (!frError) return;
  frError.textContent = message;
  frError.style.display = 'block';
}

if (frModal) {
  frModal.addEventListener('click', (e) => {
    if (e.target && e.target.dataset && e.target.dataset.close === 'true') {
      closeFriendRequestModal();
    }
  });
}

if (frCancel) {
  frCancel.addEventListener('click', closeFriendRequestModal);
}

if (frSend) {
  frSend.addEventListener('click', async () => {
    try {
      frSend.disabled = true;
      if (frCancel) frCancel.disabled = true;

      if (frError) {
        frError.style.display = 'none';
        frError.textContent = '';
      }

      const reason = (frReason?.value || '').trim();
      const res = await fetch(`${UserEndPoint}/volunteer/friends/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ friendId: userId, requestReason: reason })
      });

      if (res.status === 409) {
        closeFriendRequestModal();
        setFriendUI('friends');
        setPhoneVisibility(true);
        showToast('You are already friends.');
        return;
      }

      if (!res.ok) {
        showFriendRequestError('Failed to send request. Please try again.');
        return;
      }

      let data;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      closeFriendRequestModal();

      if (data?.autoAccepted) {
        setFriendUI('friends');
        setPhoneVisibility(true);
        showToast('Friend added successfully.');
      } else {
        setFriendUI('pending_outgoing');
        setPhoneVisibility(false);
        showToast('Friend request sent successfully.');
      }
    } catch (err) {
      console.error(err);
      showFriendRequestError('Failed to send request. Please try again.');
    } finally {
      frSend.disabled = false;

      if (frCancel) frCancel.disabled = false;
    }
  });
}

if (rmModal) {
  rmModal.addEventListener('click', (e) => {
    if (e.target && e.target.dataset && e.target.dataset.close === 'true') {
      closeRemoveFriendModal();
    }
  });
}

if (rmCancel) {
  rmCancel.addEventListener('click', closeRemoveFriendModal);
}

if (rmConfirm) {
  rmConfirm.addEventListener('click', async () => {
    try {
      rmConfirm.disabled = true;
      if (rmCancel) rmCancel.disabled = true;

      if (rmError) {
        rmError.style.display = 'none';
        rmError.textContent = '';
      }

      const reason = (rmReason?.value || '').trim();
      const res = await fetch(`${UserEndPoint}/volunteer/friends/remove/${userId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ removeReason: reason })
      });

      if (!res.ok) {
        showRemoveFriendError('Failed to remove friend. Please try again.');
        return;
      }

      closeRemoveFriendModal();
      setFriendUI('none');
      setPhoneVisibility(false);
      showToast('Removed friend successfully.');
    } catch (err) {
      console.error(err);
      showRemoveFriendError('Failed to remove friend. Please try again.');
    } finally {
      rmConfirm.disabled = false;
      if (rmCancel) rmCancel.disabled = false;
    }
  });
}

addBtn.addEventListener('click', () => {
  const state = addBtn.dataset.state;

  if (state === 'add') {
    openFriendRequestModal();
    return;
  }

  if (state === 'remove' || state === 'friends') {
    openRemoveFriendModal();
    return;
  }

  if (state === 'view_request' || state === 'pending_incoming') {
    window.location.href = './notification.html';
    return;
  }

  if (state === 'pending' || state === 'pending_outgoing') {
    showToast('Friend request is pending.');
    return;
  }
});

function setFriendUI(status) {
  addBtn.disabled = false;
  addBtn.classList.remove("danger");

  if (status === 'friends') {
    addBtn.textContent = "❌ Remove Friend";
    addBtn.classList.add("danger");
    addBtn.dataset.state = "remove";
    return;
  }

  if (status === 'pending_outgoing') {
    addBtn.textContent = "⏳ Pending";
    addBtn.dataset.state = "pending";
    addBtn.disabled = true;
    return;
  }

  if (status === 'pending_incoming') {
    addBtn.textContent = "View Request";
    addBtn.dataset.state = "view_request";
    return;
  }

  addBtn.textContent = "➕ Add Friend";
  addBtn.dataset.state = "add";
}

function setPhoneVisibility(isFriend) {
  const phoneEl = document.getElementById('hvop-phone');
  const phoneNote = document.getElementById('hvop-phone-note');

  const phoneValue = phoneEl?.dataset?.value;

  if (!phoneEl) return;

  if (isFriend && phoneValue) {
    phoneEl.textContent = phoneValue;
    if (phoneNote) phoneNote.style.display = 'none';
  } else {
    phoneEl.textContent = 'Hidden';
    if (phoneNote) phoneNote.style.display = 'block';
  }
}

// =========================
// FETCH AND RENDER PROFILE
// =========================
if (!userId) {
  alert("Invalid profile");
  location.href = "homepage_login_volunteer.html";
}

fetch(`${UserEndPoint}/volunteer/user/profile/${userId}`, {
  headers: {
    Authorization: `Bearer ${token}`
  }
})
  .then(res => {
    if (!res.ok) throw new Error('Failed to load profile');
    return res.json();
  })
  .then(renderProfile)
  .catch(err => {
    console.error(err);
    alert("Failed to load profile");
  });

function renderProfile(p) {
  // ================= HERO =================
  document.querySelector(".hvop-name").textContent = p.name;

  document.querySelector(".hvop-title").textContent = getTitle(p.level);
  document.querySelector(".hvop-level").textContent =
    `Level ${p.level} · ${getTier(p.level)}`;
  document.querySelector(".hvop-followers").textContent =
    `👥 ${p.followers} Followers`;

  // ================= OVERVIEW =================
  setOverview(0, p.followers);
  setOverview(1, p.total_events);
  setOverview(2, calcYears(p.first_event_date));

  // ================= BADGES =================
  renderBadges(p.badges);

  // ================= EVENTS =================
  renderEvents(p.events);

  // ================= EXPERIENCE =================
  renderExperience(p);

  // ================= CONTACT + ADVANTAGES =================
  renderContact(p);
  renderAdvantages(p);
}

function renderContact(p) {
  const emailEl = document.getElementById('hvop-email');
  const phoneEl = document.getElementById('hvop-phone');
  const emptyEl = document.getElementById('hvop-contact-empty');
  const phoneNote = document.getElementById('hvop-phone-note');

  const email = (p.email ?? p.Email ?? '').toString().trim();
  const phone = (p.phone ?? p.phonenumber ?? p.phoneNumber ?? p.PhoneNumber ?? p.Phone ?? '').toString().trim();

  if (emailEl) emailEl.textContent = email || '—';

  if (phoneEl) {
    phoneEl.dataset.value = phone;
  }

  if (emptyEl) {
    emptyEl.style.display = (!email && !phone) ? 'block' : 'none';
  }

  if (!phone && phoneNote) {
    phoneNote.style.display = 'none';
  }

  // Only show phone if mutual friends
  const isFriend = addBtn?.dataset?.state === 'remove';
  setPhoneVisibility(Boolean(isFriend));
}

function renderAdvantages(p) {
  const list = document.getElementById('hvop-advantages');
  const empty = document.getElementById('hvop-advantages-empty');
  if (!list) return;

  const raw = (p.advantages ?? '').toString().trim();
  const items = raw
    ? raw.split(/\n|\r\n/).map(s => s.trim()).filter(Boolean)
    : [];

  list.innerHTML = items.map(i => `<li>${i}</li>`).join('');
  if (empty) empty.style.display = items.length === 0 ? 'block' : 'none';
}

function setOverview(i, val) {
  document.querySelectorAll(".hvop-overview-card strong")[i].textContent = val;
}

/* ================= EXPERIENCE ================= */
function renderExperience(p) {
  const el = document.getElementById("experience");
  el.innerHTML = `
    <div class="hvop-text-card">
      <h2>Volunteer Experience</h2>

      <p><strong>Joined:</strong> ${formatDate(p.joindate)}</p>
      <p><strong>Events Participated:</strong> ${p.total_events}</p>
      <p><strong>Volunteer Tier:</strong> ${getTier(p.level)}</p>

      <p>
        ${p.name} has been actively contributing to community programmes,
        joining ${p.total_events} volunteer events and earning
        ${p.badges.length} badges.
      </p>
    </div>
  `;
}

/* ================= EVENTS ================= */
function renderEvents(events) {
  const grid = document.querySelector(".hvop-event-grid");
  grid.innerHTML = "";

  if (!events || events.length === 0) {
    grid.innerHTML = "<p>No events joined yet.</p>";
    return;
  }

  events.forEach(e => {
    const card = document.createElement("div");
    card.className = "hvop-event-card-3d";

    card.innerHTML = `
      <div class="hvop-event-top">📅</div>
      <div class="hvop-event-content">
        <h3>${e.eventname}</h3>
        <p class="hvop-event-date">${formatDate(e.eventdate)}</p>
        <p class="hvop-event-location">${e.location || "Unknown location"}</p>
      </div>
    `;

    grid.appendChild(card);
  });
}

/* ================= BADGES ================= */
function renderBadges(badges) {
  const grid = document.getElementById("hvop-badge-grid");
  const empty = document.getElementById("hvop-no-badges");

  grid.innerHTML = "";

  if (!badges || badges.length === 0) {
    empty.style.display = "block";
    return;
  }

  empty.style.display = "none";

  badges.forEach(b => {
    const div = document.createElement("div");
    div.className = "hvop-badge-card";

    div.innerHTML = `
      <div class="hvop-badge-icon">
        ${b.iconurl ? `<img src="${b.iconurl}">` : "🏅"}
      </div>
      <div class="hvop-badge-name">${b.badgename}</div>
    `;

    grid.appendChild(div);
  });
}

/* ================= UTILS ================= */
function formatDate(d) {
  return new Date(d).toLocaleDateString();
}

function calcYears(first) {
  if (!first) return "1 Year";
  const years = Math.max(
    1,
    Math.floor((Date.now() - new Date(first)) / (1000 * 60 * 60 * 24 * 365))
  );
  return `${years} Years`;
}

function getTitle(level) {
  if (level >= 10) return "Community Champion";
  if (level >= 6) return "Community Guardian";
  if (level >= 3) return "Active Volunteer";
  return "New Volunteer";
}

function getTier(level) {
  if (level >= 10) return "Platinum Volunteer";
  if (level >= 6) return "Gold Volunteer";
  if (level >= 3) return "Silver Volunteer";
  return "Bronze Volunteer";
}
/* ================= EXPORTS ================= */