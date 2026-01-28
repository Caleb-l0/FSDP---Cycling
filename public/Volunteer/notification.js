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
const EVENT_UPDATE_SEEN_KEY = 'hv_seen_event_updates_v1';

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

function normalizeEventId(e) {
  const id = Number(e?.eventid ?? e?.EventID ?? e?.EventId ?? e?.id);
  return Number.isFinite(id) ? id : null;
}

function normalizeStatus(s) {
  return String(s ?? '').trim().toLowerCase();
}

function safeParseJson(val, fallback) {
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

function getEventUpdateSignature(e) {
  const id = normalizeEventId(e);
  if (!id) return null;
  const status = normalizeStatus(e.status);
  const orgId = Number(e.organizationid ?? e.OrganizationID ?? e.organization_id ?? 0) || 0;
  const reqVol = Number(e.requiredvolunteers ?? e.RequiredVolunteers ?? 0) || 0;
  const volCount = Number(e.volunteer_signup_count ?? e.volunteerSignupCount ?? 0) || 0;
  const maxP = Number(e.maximumparticipant ?? e.MaximumParticipant ?? 0) || 0;
  return `${id}|${status}|org:${orgId}|reqv:${reqVol}|vol:${volCount}|maxp:${maxP}`;
}

function getEventUpdateType(e) {
  const status = normalizeStatus(e.status);
  const date = e.eventdate ? new Date(e.eventdate) : null;
  const isFuture = date && !Number.isNaN(date.getTime()) ? (date.getTime() > Date.now()) : true;
  const orgId = Number(e.organizationid ?? 0) || 0;
  const reqVol = Number(e.requiredvolunteers ?? 0) || 0;
  const volCount = Number(e.volunteer_signup_count ?? 0) || 0;

  if (status.includes('cancel')) return 'cancelled';
  if (isFuture && orgId) return 'open';
  if (isFuture && reqVol > 0 && volCount < reqVol) return 'short';
  return null;
}

function buildEventUpdateMessage(type, e) {
  const name = e.eventname || e.EventName || 'Event';
  if (type === 'cancelled') return `❌ Event cancelled: ${name}`;
  if (type === 'short') return `⚠️ Short of volunteers: ${name}`;
  if (type === 'open') return `✅ Event open for registration: ${name}`;
  return `🔔 Event update: ${name}`;
}

function renderEventNotification(newEvents, latestEventId) {
  if (!eventCard || !eventListEl) return;
  eventCard.style.display = 'block';

  const items = Array.isArray(newEvents) ? newEvents : [];
  const count = items.length;
  const eventText = count === 1 ? 'You have 1 event update!' : `You have ${count} event updates!`;

  const eventsHtml = items.slice(0, 6).map(e => {
    const type = e._updateType || getEventUpdateType(e) || 'open';
    const msg = buildEventUpdateMessage(type, e);
    const date = e.eventdate ? new Date(e.eventdate).toLocaleDateString() : '';
    const loc = e.location || e.Location || '';
    const reqVol = Number(e.requiredvolunteers ?? 0) || 0;
    const volCount = Number(e.volunteer_signup_count ?? 0) || 0;
    const extra = (type === 'short' && reqVol > 0)
      ? `<span class="noti-event-loc">Need ${reqVol}, now ${volCount}</span>`
      : '';
    return `
      <div class="noti-event-item">
        <strong>${escapeHtml(msg)}</strong>
        ${date ? `<span class="noti-event-date">${escapeHtml(date)}</span>` : ''}
        ${loc ? `<span class="noti-event-loc">📍 ${escapeHtml(loc)}</span>` : ''}
        ${extra}
      </div>
    `;
  }).join('');

  eventListEl.innerHTML = `
    <div class="noti-item noti-item--event">
      <div class="noti-item-top">
        <div>
          <div class="noti-from">${eventText}</div>
          <div class="noti-meta">Events updates: open / cancelled / short of volunteers.</div>
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

    let seenMap = {};
    try {
      seenMap = safeParseJson(localStorage.getItem(EVENT_UPDATE_SEEN_KEY) || '{}', {});
    } catch {
      seenMap = {};
    }

    const updates = [];
    for (const e of (events || [])) {
      const id = normalizeEventId(e);
      if (!id) continue;
      const type = getEventUpdateType(e);
      if (!type) continue;
      const sig = getEventUpdateSignature(e);
      if (!sig) continue;
      if (seenMap[String(id)] === sig) continue;
      updates.push({ ...e, _updateType: type, _sig: sig });
    }

    if (updates.length === 0) {
      eventCard.style.display = 'none';
      return;
    }

    renderEventNotification(updates, latestId);

    const markSeen = () => {
      try {
        for (const u of updates) {
          const id = normalizeEventId(u);
          if (!id) continue;
          if (u._sig) seenMap[String(id)] = u._sig;
        }
        localStorage.setItem(EVENT_UPDATE_SEEN_KEY, JSON.stringify(seenMap));
        localStorage.setItem(LAST_SEEN_EVENT_KEY, String(latestId));
      } catch (e) {
        /* ignore */
      }
    };

    const dismiss = document.getElementById('btnDismissEvent');
    if (dismiss) dismiss.onclick = () => {
      markSeen();
      eventCard.style.display = 'none';
    };

    if (eventMarkReadBtn) {
      eventMarkReadBtn.onclick = () => {
        markSeen();
        eventCard.style.display = 'none';
      };
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
    listEl.innerHTML = `
      <div class="hv-empty">
        <div class="hv-empty__icon" aria-hidden="true"><i class="fas fa-bell"></i></div>
        <p class="hv-empty__title">No notifications</p>
        <p class="hv-empty__sub">Friend requests and updates will appear here.</p>
      </div>
    `;
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
  listEl.innerHTML = `
    <div class="hv-empty">
      <div class="hv-empty__icon" aria-hidden="true"><i class="fas fa-circle-notch"></i></div>
      <p class="hv-empty__title">Loading</p>
      <p class="hv-empty__sub">Please wait a moment.</p>
    </div>
  `;
  try {
    await loadEventNotification();
    const items = await fetchIncoming();
    render(items);
  } catch (e) {
    console.error(e);
    listEl.innerHTML = `
      <div class="hv-empty">
        <div class="hv-empty__icon" aria-hidden="true"><i class="fas fa-triangle-exclamation"></i></div>
        <p class="hv-empty__title">Unable to load</p>
        <p class="hv-empty__sub">Please check your connection and try again.</p>
      </div>
    `;
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
