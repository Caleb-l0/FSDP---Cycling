const token = localStorage.getItem("token");
if (!token) {
  alert("Please log in to access the volunteer friends page.");
  window.location.href = "../../index.html";
}

const API_BASE = (window.location.origin && window.location.origin !== 'null')
  ? window.location.origin
  : "https://fsdp-cycling-ltey.onrender.com";


let friendsData = [];
let currentFilter = "recent";
let currentQuery = "";

document.addEventListener("DOMContentLoaded", () => {
  loadFriends();
  setupFilters();
  setupSearch();
  setupAddFriend();
});

async function loadFriends() {
  try {
    const res = await fetch(
      `${API_BASE}/volunteer/friends/me`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    friendsData = await res.json();
    updateFriendCount();
    renderFriends();
  } catch (err) {
    console.error("Load friends error", err);
    const list = document.getElementById("friendsList");
    list.innerHTML = `
      <div class="hvf-empty-state">
        <p>Unable to load friends. Please try again later.</p>
      </div>
    `;
  }
}

function setupSearch() {
  const input = document.getElementById("friendsSearch");
  if (!input) return;

  input.addEventListener("input", () => {
    currentQuery = String(input.value || "").trim().toLowerCase();
    renderFriends();
  });
}

function updateFriendCount() {
  const el = document.getElementById("friendsCount");
  if (!el) return;
  const count = Array.isArray(friendsData) ? friendsData.length : 0;
  el.textContent = `${count} friend${count === 1 ? "" : "s"}`;
}

function setupFilters() {
  // Fix: Use .hvf-pill instead of .filter-btn to match HTML
  document.querySelectorAll(".hvf-pill").forEach(btn => {
    btn.addEventListener("click", () => {
      // Remove active class from all pills
      document.querySelectorAll(".hvf-pill").forEach(b => b.classList.remove("hvf-active"));
      // Add active class to clicked pill
      btn.classList.add("hvf-active");
      currentFilter = btn.dataset.filter;
      renderFriends();
    });
  });
}

function renderFriends() {
  const list = document.getElementById("friendsList");
  list.innerHTML = "";

  // Handle empty state
  if (!friendsData || friendsData.length === 0) {
    list.innerHTML = `
      <div class="hvf-empty-state">
        <p>You don't have any friends yet. Start connecting with other volunteers!</p>
      </div>
    `;
    return;
  }

  let sorted = [...friendsData];

  // Sort based on current filter
  if (currentFilter === "recent") {
    sorted.sort((a, b) => new Date(b.adddate) - new Date(a.adddate));
  } else if (currentFilter === "close") {
    sorted.sort((a, b) => b.friend_level - a.friend_level);
  } else if (currentFilter === "alpha") {
    sorted.sort((a, b) => {
      const nameA = (a.nickname || a.name || "").toLowerCase();
      const nameB = (b.nickname || b.name || "").toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }

  if (currentQuery) {
    sorted = sorted.filter((f) => {
      const name = (f.nickname || f.name || "").toLowerCase();
      const username = (f.username || "").toLowerCase();
      const bio = (f.bio || "").toLowerCase();
      const email = (f.email || "").toLowerCase();
      return (
        name.includes(currentQuery) ||
        username.includes(currentQuery) ||
        bio.includes(currentQuery) ||
        email.includes(currentQuery)
      );
    });
  }

  if (sorted.length === 0) {
    list.innerHTML = `
      <div class="hvf-empty-state">
        <p>No friends match your search.</p>
      </div>
    `;
    return;
  }

  // Render friend cards
  sorted.forEach(f => {
    const card = document.createElement("div");
    card.className = "hvf-friend-card";
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");

    const friendName = f.nickname || f.name || "Unknown";
    const joinDate = f.joindate ? new Date(f.joindate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : "Date unknown";
    const friendLevel = f.friend_level || 0;
    const username = f.username ? `@${f.username}` : "@unknown";
    const bio = f.bio || "No bio available.";
    const email = f.email || "No email available.";

    card.innerHTML = `
      <div class="hvf-friend-main">
        <img src="./default_user.png" class="hvf-friend-avatar" alt="${friendName}'s avatar">

        <div class="hvf-friend-text">
          <div class="hvf-friend-name">${friendName}</div>
          <div class="hvf-friend-username">${username}</div>
          <div class="hvf-friend-bio">${bio}</div>
          <div class="hvf-friend-email">${email}</div>

          <div class="hvf-friend-meta">Joined ${joinDate}</div>
          <div class="hvf-friend-level">Level ${friendLevel}</div>
        </div>
      </div>
    `;

    const friendId = f.friendid ?? f.friendId ?? f.userid ?? f.userId ?? f.id;
    if (friendId != null) {
      const go = () => {
        window.location.href = `./userProfile.html?userId=${encodeURIComponent(friendId)}`;
      };
      card.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  go();
});
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          go();
        }
      });
    }

    list.appendChild(card);
  });
}

function setupAddFriend() {
  const openBtn = document.getElementById('openAddFriend');
  const modal = document.getElementById('addFriendModal');
  const overlay = document.getElementById('addFriendOverlay');
  const closeBtn = document.getElementById('closeAddFriend');
  const input = document.getElementById('addFriendQuery');
  const resultsEl = document.getElementById('addFriendResults');
  const hintEl = document.getElementById('addFriendHint');

  if (!openBtn || !modal || !overlay || !closeBtn || !input || !resultsEl || !hintEl) return;

  const open = () => {
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    input.value = '';
    hintEl.textContent = 'Start typing to search volunteers.';
    resultsEl.innerHTML = '';
    setTimeout(() => input.focus(), 0);
  };

  const close = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
  };

  openBtn.addEventListener('click', open);
  overlay.addEventListener('click', close);
  closeBtn.addEventListener('click', close);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) close();
  });

  let searchTimer = null;
  input.addEventListener('input', () => {
    const q = String(input.value || '').trim();
    if (searchTimer) window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => {
      runUserSearch(q, resultsEl, hintEl);
    }, 250);
  });
}

async function runUserSearch(query, resultsEl, hintEl) {
  const q = String(query || '').trim();

  if (!q) {
    hintEl.textContent = 'Start typing to search volunteers.';
    resultsEl.innerHTML = '';
    return;
  }

  hintEl.textContent = 'Searching...';
  resultsEl.innerHTML = '';

  try {
    const res = await fetch(`${API_BASE}/volunteer/users/search?q=${encodeURIComponent(q)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error(`Search failed (${res.status})`);
    const data = await res.json();
    const users = Array.isArray(data) ? data : [];

    if (users.length === 0) {
      hintEl.textContent = 'No users found.';
      return;
    }

    hintEl.textContent = `Found ${users.length} user${users.length === 1 ? '' : 's'}.`;
    resultsEl.innerHTML = '';

    users.forEach((u) => {
      const row = document.createElement('div');
      row.className = 'hvf-result';

      const name = u.name || 'Unknown';
      const email = u.email || 'No email';
      const phone = u.phonenumber || u.phone || '';
      const level = (u.level != null) ? `Level ${u.level}` : '';

      row.innerHTML = `
        <div class="hvf-result__main">
          <div class="hvf-result__name">${escapeHtml(name)}</div>
          <div class="hvf-result__meta">${escapeHtml(email)}${phone ? ` • ${escapeHtml(phone)}` : ''}${level ? ` • ${escapeHtml(level)}` : ''}</div>
        </div>
        <button class="hvf-result__action" type="button">Add</button>
      `;

      const btn = row.querySelector('button');
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        btn.textContent = 'Adding...';
        const ok = await sendAddFriend(u.id);
        if (ok) {
          btn.textContent = 'Sent';
          await loadFriends();
        } else {
          btn.disabled = false;
          btn.textContent = 'Add';
        }
      });

      resultsEl.appendChild(row);
    });
  } catch (e) {
    console.error('[add-friend] search error:', e);
    hintEl.textContent = 'Failed to search. Please try again.';
  }
}

async function sendAddFriend(friendId) {
  const id = Number(friendId);
  if (!Number.isFinite(id) || id <= 0) return false;

  try {
    const res = await fetch(`${API_BASE}/volunteer/friends/add`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ friendId: id })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data.message || 'Failed to add friend.');
      return false;
    }

    alert(data.message || 'Friend request sent.');
    return true;
  } catch (e) {
    console.error('[add-friend] add error:', e);
    alert('Failed to add friend. Please try again later.');
    return false;
  }
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
