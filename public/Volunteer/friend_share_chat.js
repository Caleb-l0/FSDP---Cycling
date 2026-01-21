const token = localStorage.getItem('token');
if (!token) {
  window.location.href = '../../index.html';
}

const params = new URLSearchParams(window.location.search);
const friendId = params.get('friendId');
const eventId = params.get('eventId');

if (!friendId || !eventId) {
  alert('Invalid share link');
  window.location.href = './homepage_login_volunteer.html';
}

function sanitizePhoneForWhatsApp(phone) {
  const raw = String(phone || '').trim();
  return raw ? raw.replace(/[^\d]/g, '') : '';
}

function buildEventUrl() {
  const u = new URL(`./volunteer_event_detail.html?eventId=${encodeURIComponent(eventId)}`, window.location.href);
  return u.href;
}

function buildMessage({ name, date, location }) {
  const dateText = date ? new Date(date).toLocaleString() : '';
  const link = buildEventUrl();
  const lines = [
    `Event: ${name || 'Volunteer Event'}`,
    dateText ? `Date: ${dateText}` : '',
    location ? `Location: ${location}` : '',
    `Link: ${link}`,
    'Let\'s join together!'
  ].filter(Boolean);
  return lines.join('\n');
}

async function loadEvent() {
  const res = await fetch(`https://fsdp-cycling-ltey.onrender.com/volunteer/events/${encodeURIComponent(eventId)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to load event');
  return res.json();
}

async function loadFriendProfile() {
  const res = await fetch(`https://fsdp-cycling-ltey.onrender.com/volunteer/user/profile/${encodeURIComponent(friendId)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to load friend');
  return res.json();
}

async function loadFriendStatus() {
  const res = await fetch(`https://fsdp-cycling-ltey.onrender.com/volunteer/friends/status/${encodeURIComponent(friendId)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to load friend status');
  return res.json();
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    alert('Copied');
  } catch {
    prompt('Copy:', text);
  }
}

async function main() {
  const backBtn = document.getElementById('hvscBack');
  if (backBtn) backBtn.addEventListener('click', () => history.back());

  const openBtn = document.getElementById('hvscOpenWa');
  const copyBtn = document.getElementById('hvscCopyPhone');

  const eventNameEl = document.getElementById('hvscEventName');
  const eventDateEl = document.getElementById('hvscEventDate');
  const eventLocEl = document.getElementById('hvscEventLoc');
  const eventLinkEl = document.getElementById('hvscEventLink');

  const friendNameEl = document.getElementById('hvscFriendName');
  const friendPhoneEl = document.getElementById('hvscFriendPhone');
  const phoneNoteEl = document.getElementById('hvscPhoneNote');

  const previewEl = document.getElementById('hvscMessagePreview');

  let evt;
  let friend;
  let status;

  try {
    [evt, friend, status] = await Promise.all([loadEvent(), loadFriendProfile(), loadFriendStatus()]);
  } catch (e) {
    alert('Unable to load share page');
    window.location.href = './homepage_login_volunteer.html';
    return;
  }

  const eventUrl = buildEventUrl();
  const message = buildMessage({ name: evt.eventname, date: evt.eventdate, location: evt.location });

  if (eventNameEl) eventNameEl.textContent = evt.eventname || '—';
  if (eventDateEl) eventDateEl.textContent = evt.eventdate ? new Date(evt.eventdate).toLocaleString() : '—';
  if (eventLocEl) eventLocEl.textContent = evt.location || '—';
  if (eventLinkEl) {
    eventLinkEl.href = eventUrl;
    eventLinkEl.target = '_blank';
    eventLinkEl.rel = 'noopener';
  }

  if (friendNameEl) friendNameEl.textContent = friend.name || friend.nickname || '—';

  const isFriend = status?.status === 'friends';
  const rawPhone = (friend.phone ?? friend.phonenumber ?? friend.phoneNumber ?? friend.PhoneNumber ?? friend.Phone ?? '').toString().trim();
  const waPhone = isFriend ? sanitizePhoneForWhatsApp(rawPhone) : '';

  if (friendPhoneEl) friendPhoneEl.textContent = (isFriend && rawPhone) ? rawPhone : 'Hidden';
  if (phoneNoteEl) phoneNoteEl.style.display = (!isFriend && rawPhone) ? 'block' : 'none';

  if (previewEl) previewEl.textContent = message;

  if (openBtn) {
    openBtn.addEventListener('click', async () => {
      if (!waPhone) {
        alert('Phone number is not available. Add as friend to view WhatsApp number.');
        return;
      }
      const url = `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank', 'noopener');
    });
  }

  if (copyBtn) {
    copyBtn.disabled = !Boolean(waPhone);
    copyBtn.addEventListener('click', async () => {
      if (!waPhone) return;
      await copyText(rawPhone);
    });
  }
}

document.addEventListener('DOMContentLoaded', main);
