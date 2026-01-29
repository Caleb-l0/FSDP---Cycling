const UserEndPoint = (window.location.origin && window.location.origin !== 'null')
  ? window.location.origin
  : 'https://fsdp-cycling-ltey.onrender.com';
const token = localStorage.getItem("token");
const profileParams = new URLSearchParams(window.location.search);
const userId = profileParams.get("userId");
const openWa = profileParams.get('openWa') === '1';
const waTextParam = profileParams.get('waText');

const addBtn = document.getElementById("hvop-add-friend-btn");

let hvAutoWaTried = false;

function tryAutoOpenWhatsApp() {
  if (hvAutoWaTried) return;
  if (!openWa) return;
  const waBtn = document.getElementById('hvop-whatsapp-btn');
  const isFriend = addBtn?.dataset?.state === 'remove';
  if (!waBtn || !isFriend || waBtn.style.display === 'none') return;
  hvAutoWaTried = true;
  setTimeout(() => {
    waBtn.click();
    try {
      const newUrl = `${window.location.pathname}?userId=${encodeURIComponent(userId)}`;
      window.history.replaceState({}, '', newUrl);
    } catch (e) {
      /* ignore */
    }
  }, 250);
}

console.log('[userProfile] Loaded with userId:', userId, 'token exists:', !!token);

if (!token) {
  window.location.href = "../../index.html";
}

if (!userId || userId === 'null' || userId === 'undefined') {
  console.error('[userProfile] Invalid userId:', userId);
  alert('Invalid profile link');
  window.location.href = './homepage_login_volunteer.html';
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
    tryAutoOpenWhatsApp();
  }
  catch (err) {
    console.error("Check friend error", err);
  }
}

if (addBtn) {
  checkIfFriend();
}

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

let lastFocusBeforeFrModal = null;
let lastFocusBeforeRmModal = null;

const toastEl = document.getElementById('hvop-toast');
let toastTimer;

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
        <h3 class="hv-congrats__title">Congratulations!</h3>
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
  }, 1600);
}

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
  lastFocusBeforeFrModal = document.activeElement;
  frModal.classList.add('is-open');
  frModal.setAttribute('aria-hidden', 'false');
  try { frModal.inert = false; } catch (e) { /* ignore */ }
  if (frError) {
    frError.style.display = 'none';
    frError.textContent = '';
  }
  if (frReason) frReason.value = '';
  setTimeout(() => frReason?.focus(), 0);
}

function closeFriendRequestModal() {
  if (!frModal) return;
  const fallbackFocus = addBtn || document.body;
  const targetFocus = lastFocusBeforeFrModal && document.contains(lastFocusBeforeFrModal)
    ? lastFocusBeforeFrModal
    : fallbackFocus;
  if (targetFocus && typeof targetFocus.focus === 'function') {
    targetFocus.focus();
  }
  frModal.classList.remove('is-open');
  frModal.setAttribute('aria-hidden', 'true');
  try { frModal.inert = true; } catch (e) { /* ignore */ }
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
      console.log('[Friend Request] Sending request to userId:', userId, 'reason:', reason);
      const res = await fetch(`${UserEndPoint}/volunteer/friends/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ friendId: userId, requestReason: reason })
      });

      console.log('[Friend Request] Response status:', res.status);

      if (res.status === 409) {
        closeFriendRequestModal();
        setFriendUI('friends');
        setPhoneVisibility(true);
        showToast('You are already friends.');
        showCongrats('You are already friends!');
        setTimeout(() => window.location.reload(), 2000);
        return;
      }

      if (!res.ok) {
        let errMsg = 'Failed to send request. Please try again.';
        try {
          const errData = await res.json();
          console.error('[Friend Request] Server error:', errData);
          errMsg = errData?.message || errData?.error || errMsg;
        } catch {
          // ignore parse error
        }
        showFriendRequestError(errMsg);
        showToast(errMsg);
        return;
      }

      let data;
      try {
        data = await res.json();
        console.log('[Friend Request] Success data:', data);
      } catch {
        data = null;
      }

      closeFriendRequestModal();

      if (data?.autoAccepted) {
        setFriendUI('friends');
        setPhoneVisibility(true);
        showToast('Friend added successfully.');
        showCongrats('Friend added successfully!');
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setFriendUI('pending_outgoing');
        setPhoneVisibility(false);
        showToast('Friend request sent successfully.');
        showCongrats('Friend request sent successfully!');
        setTimeout(() => window.location.reload(), 2000);
      }
    } catch (err) {
      console.error('[Friend Request] Exception:', err);
      showFriendRequestError('Failed to send request. Please try again.');
      showToast('Failed to send request. Check console for details.');
    } finally {
      frSend.disabled = false;

      if (frCancel) frCancel.disabled = false;
    }
  });
}

function openRemoveFriendModal() {
  if (!rmModal) return;
  lastFocusBeforeRmModal = document.activeElement;
  rmModal.classList.add('is-open');
  rmModal.setAttribute('aria-hidden', 'false');
  try { rmModal.inert = false; } catch (e) { /* ignore */ }
  if (rmError) {
    rmError.style.display = 'none';
    rmError.textContent = '';
  }
  if (rmReason) rmReason.value = '';
  setTimeout(() => rmReason?.focus(), 0);
}

function closeRemoveFriendModal() {
  if (!rmModal) return;
  const fallbackFocus = addBtn || document.body;
  const targetFocus = lastFocusBeforeRmModal && document.contains(lastFocusBeforeRmModal)
    ? lastFocusBeforeRmModal
    : fallbackFocus;
  if (targetFocus && typeof targetFocus.focus === 'function') {
    targetFocus.focus();
  }
  rmModal.classList.remove('is-open');
  rmModal.setAttribute('aria-hidden', 'true');
  try { rmModal.inert = true; } catch (e) { /* ignore */ }
}

function showRemoveFriendError(message) {
  if (!rmError) return;
  rmError.textContent = message;
  rmError.style.display = 'block';
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
      console.log('[Remove Friend] Removing friendId:', userId, 'reason:', reason);
      const res = await fetch(`${UserEndPoint}/volunteer/friends/remove/${userId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ removeReason: reason })
      });

      console.log('[Remove Friend] Response status:', res.status);

      if (!res.ok) {
        let errMsg = 'Failed to remove friend. Please try again.';
        try {
          const errData = await res.json();
          console.error('[Remove Friend] Server error:', errData);
          errMsg = errData?.message || errData?.error || errMsg;
        } catch {
          // ignore parse error
        }
        showRemoveFriendError(errMsg);
        showToast(errMsg);
        return;
      }

      console.log('[Remove Friend] Success');
      closeRemoveFriendModal();
      setFriendUI('none');
      setPhoneVisibility(false);
      showToast('Removed friend successfully.');
      showCongrats('Removed friend successfully.');
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      console.error('[Remove Friend] Exception:', err);
      showRemoveFriendError('Failed to remove friend. Please try again.');
      showToast('Failed to remove friend. Check console for details.');
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
  const waBtn = document.getElementById('hvop-whatsapp-btn');

  const phoneValue = phoneEl?.dataset?.value;

  if (!phoneEl) return;

  if (isFriend && phoneValue) {
    phoneEl.textContent = phoneValue;
    if (phoneNote) phoneNote.style.display = 'none';
    if (waBtn) waBtn.style.display = 'inline-flex';
  } else {
    phoneEl.textContent = 'Hidden';
    if (phoneNote) phoneNote.style.display = 'block';
    if (waBtn) waBtn.style.display = 'none';
  }
}

function sanitizePhoneForWhatsApp(phone) {
  const raw = String(phone || '').trim();
  if (!raw) return '';
  return raw.replace(/[^\d]/g, '');
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
    if (res.status === 401 || res.status === 403) {
      window.location.href = "../../index.html";
      return null;
    }
    if (!res.ok) throw new Error('Failed to load profile');
    return res.json();
  })
  .then(p => {
    if (!p) return;
    renderProfile(p);
  })
  .catch(err => {
    console.error(err);
    alert("Failed to load profile");
  });

function renderProfile(p) {
  // Normalize API shape to avoid runtime crashes when fields are missing
  p = p || {};
  p.badges = Array.isArray(p.badges) ? p.badges : [];
  p.events = Array.isArray(p.events) ? p.events : [];

  p.followers = Number(p.followers) || 0;
  p.total_events = Number(p.total_events) || 0;
  p.level = Number(p.level) || 0;

  const avatarImg = document.querySelector('.hvop-avatar');
  const profilePic = (p.profilepicture || p.profilePicture || '').toString().trim();
  if (avatarImg && profilePic) {
    avatarImg.src = profilePic;
  }

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

function setOverview(i, val) {
  document.querySelectorAll(".hvop-overview-card strong")[i].textContent = val;
}

/* ================= EXPERIENCE ================= */
function renderExperience(p) {
  const el = document.getElementById("experience");
  const badges = Array.isArray(p?.badges) ? p.badges : [];
  el.innerHTML = `
    <div class="hvop-text-card">
      <h2>Volunteer Experience</h2>

      <p><strong>Joined:</strong> ${formatDate(p.joindate)}</p>
      <p><strong>Events Participated:</strong> ${p.total_events}</p>
      <p><strong>Volunteer Tier:</strong> ${getTier(p.level)}</p>

      <p>
        ${p.name} has been actively contributing to community programmes,
        joining ${p.total_events} volunteer events and earning
        ${badges.length} badges.
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