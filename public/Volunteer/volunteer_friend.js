const token = localStorage.getItem("token");
if (!token) {
  alert("Please log in to access the volunteer friends page.");
  window.location.href = "../../index.html";
}


let friendsData = [];
let currentFilter = "recent";
let currentQuery = "";

document.addEventListener("DOMContentLoaded", () => {
  loadFriends();
  setupFilters();
  setupSearch();
});

async function loadFriends() {
  try {
    const res = await fetch(
      "https://fsdp-cycling-ltey.onrender.com/volunteer/friends/me",
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
