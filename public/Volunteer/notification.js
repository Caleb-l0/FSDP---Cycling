const API_BASE = "https://fsdp-cycling-ltey.onrender.com";

const token = localStorage.getItem("token");
if (!token) {
  alert("Please log in to access notifications.");
  window.location.href = "../../index.html";
}

const listEl = document.getElementById("notiList");
const refreshBtn = document.getElementById("btnRefresh");

const eventCard = document.getElementById('eventNotiCard');
const eventListEl = document.getElementById('eventNotiList');
const eventMarkReadBtn = document.getElementById('btnEventMarkRead');

const EVENTS_ENDPOINT = `${API_BASE}/volunteer/events`;
const LAST_SEEN_EVENT_KEY = 'hv_last_seen_eventid';

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

function ensureToastEl() {
  let el = document.getElementById('hvToast');
  if (el) return el;
  el = document.createElement('div');
  el.id = 'hvToast';
  el.className = 'hv-toast';
  document.body.appendChild(el);
  return el;
}

function showToast(message) {
  const el = ensureToastEl();
  el.textContent = message;
  el.classList.add('is-show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.classList.remove('is-show');
  }, 2200);
}

function getLatestEventId(events) {
  if (!Array.isArray(events) || events.length === 0) return null;
  const ids = events
    .map(e => Number(e.eventid ?? e.EventID ?? e.EventId ?? e.id))
    .filter(n => Number.isFinite(n));
  if (ids.length === 0) return null;
  return Math.max(...ids);
}

async function fetchEvents() {
  const res = await fetch(EVENTS_ENDPOINT);
  if (!res.ok) throw new Error('Failed to load events');
  return res.json();
}

function renderEventNotification(newEvents, latestEventId) {
  if (!eventCard || !eventListEl) return;
  eventCard.style.display = 'block';
  
  const count = Array.isArray(newEvents) ? newEvents.length : 1;
  const eventText = count === 1 ? 'A new event has been approved!' : `${count} new events have been approved!`;
  
  let eventsHtml = '';
  if (Array.isArray(newEvents) && newEvents.length > 0) {
    eventsHtml = newEvents.slice(0, 5).map(e => {
      const name = e.eventname || e.EventName || 'New Event';
      const date = e.eventdate ? new Date(e.eventdate).toLocaleDateString() : '';
      const loc = e.location || e.Location || '';
      return `
        <div class="noti-event-item">
          <strong>📅 ${escapeHtml(name)}</strong>
          ${date ? `<span class="noti-event-date">${date}</span>` : ''}
          ${loc ? `<span class="noti-event-loc">📍 ${escapeHtml(loc)}</span>` : ''}
        </div>
      `;
    }).join('');
  }
  
  eventListEl.innerHTML = `
    <div class="noti-item noti-item--event">
      <div class="noti-item-top">
        <div>
          <div class="noti-from">${eventText}</div>
          <div class="noti-meta">Admin has approved new events. Sign up now!</div>
        </div>
      </div>
      ${eventsHtml ? `<div class="noti-event-list">${eventsHtml}</div>` : ''}
      <div class="noti-actions">
        <button class="noti-action noti-action--accept" type="button" id="btnGoBooking">🎯 Go to Booking</button>
        <button class="noti-action" type="button" id="btnDismissEvent">Dismiss</button>
      </div>
    </div>
  `;

  const go = document.getElementById('btnGoBooking');
  if (go) go.onclick = () => window.location.href = './volunteer-events.html';

  const dismiss = document.getElementById('btnDismissEvent');
  if (dismiss) {
    dismiss.onclick = () => {
      try { localStorage.setItem(LAST_SEEN_EVENT_KEY, String(latestEventId)); } catch (e) { /* ignore */ }
      eventCard.style.display = 'none';
    };
  }

  if (eventMarkReadBtn) {
    eventMarkReadBtn.onclick = () => {
      try { localStorage.setItem(LAST_SEEN_EVENT_KEY, String(latestEventId)); } catch (e) { /* ignore */ }
      eventCard.style.display = 'none';
    };
  }
}

async function loadEventNotification() {
  if (!eventCard || !eventListEl) return;
  try {
    const events = await fetchEvents();
    const latestId = getLatestEventId(events);
    if (!latestId) {
      eventCard.style.display = 'none';
      return;
    }

    let lastSeen = null;
    try { lastSeen = Number(localStorage.getItem(LAST_SEEN_EVENT_KEY)); } catch (e) { lastSeen = null; }

    if (!Number.isFinite(lastSeen) || lastSeen <= 0) {
      try { localStorage.setItem(LAST_SEEN_EVENT_KEY, String(latestId)); } catch (e) { /* ignore */ }
      eventCard.style.display = 'none';
      return;
    }

    if (latestId > lastSeen) {
      // Filter to show only new events (id > lastSeen)
      const newEvents = (events || []).filter(e => {
        const id = Number(e.eventid ?? e.EventID ?? e.EventId ?? e.id);
        return Number.isFinite(id) && id > lastSeen;
      });
      renderEventNotification(newEvents, latestId);
    } else {
      eventCard.style.display = 'none';
    }
  } catch (e) {
    console.error('[loadEventNotification] Error:', e);
    eventCard.style.display = 'none';
  }
}

async function fetchIncoming() {
  const res = await fetch(`${API_BASE}/volunteer/friends/requests/incoming`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Failed to load notifications");
  return res.json();
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function render(items) {
  if (!items || items.length === 0) {
    listEl.innerHTML = `<div class="noti-empty">No notifications yet.</div>`;
    return;
  }

  listEl.innerHTML = items.map(r => {
    const dateStr = r.requestdate ? new Date(r.requestdate).toLocaleString() : "";
    return `
      <div class="noti-item" data-request-id="${r.requestid}">
        <div class="noti-item-top">
          <div>
            <div class="noti-from">${escapeHtml(r.sendername || "Unknown")}</div>
            <div class="noti-meta">${escapeHtml(r.senderemail || "")} • ${escapeHtml(dateStr)}</div>
          </div>
        </div>
        ${r.requestreason ? `<div class="noti-reason"><b>Reason:</b> ${escapeHtml(r.requestreason)}</div>` : ""}
        <div class="noti-actions">
          <button class="noti-action noti-action--accept" type="button" data-action="accept">Accept</button>
          <button class="noti-action noti-action--reject" type="button" data-action="reject">Reject</button>
        </div>
      </div>
    `;
  }).join("");
}

async function acceptRequest(requestId) {
  const res = await fetch(`${API_BASE}/volunteer/friends/requests/${requestId}/accept`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    let msg = `Failed to accept request (${res.status})`;
    try {
      const data = await res.json();
      msg = data?.message || data?.error || data?.code || msg;
    } catch {
      try {
        const text = await res.text();
        if (text) msg = text;
      } catch {
        // ignore
      }
    }
    throw new Error(msg);
  }
}

async function rejectRequest(requestId) {
  const res = await fetch(`${API_BASE}/volunteer/friends/requests/${requestId}/reject`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    let msg = `Failed to reject request (${res.status})`;
    try {
      const data = await res.json();
      msg = data?.message || data?.error || data?.code || msg;
    } catch {
      try {
        const text = await res.text();
        if (text) msg = text;
      } catch {
        // ignore
      }
    }
    throw new Error(msg);
  }
}

async function load() {
  listEl.innerHTML = `<div class="noti-empty">Loading...</div>`;
  try {
    await loadEventNotification();
    const items = await fetchIncoming();
    render(items);
  } catch (e) {
    console.error(e);
    listEl.innerHTML = `<div class="noti-empty">Unable to load notifications.</div>`;
  }
}

listEl.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;

  const item = e.target.closest(".noti-item");
  const requestId = item?.dataset?.requestId;
  if (!requestId) return;

  btn.disabled = true;

  try {
    if (btn.dataset.action === "accept") {
      await acceptRequest(requestId);
      showToast('Friend request accepted.');
      showCongrats('Friend request accepted!');
    } else {
      const ok = confirm("Reject this friend request?");
      if (!ok) {
        btn.disabled = false;
        return;
      }
      await rejectRequest(requestId);
      showToast('Friend request rejected.');
      showCongrats('Friend request rejected.');
    }

    await load();
  } catch (err) {
    console.error(err);
    showToast(err?.message || 'Action failed. Please try again.');
    btn.disabled = false;
  }
});

refreshBtn?.addEventListener("click", load);

document.addEventListener("DOMContentLoaded", load);
