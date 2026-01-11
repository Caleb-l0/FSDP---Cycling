const token = localStorage.getItem("token");
if (!token) {
  alert("Please log in");
  window.location.href = "../../index.html";
}

let friendsData = [];
let currentFilter = "recent";

document.addEventListener("DOMContentLoaded", () => {
  loadFriends();
  setupFilters();
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

    friendsData = await res.json();
    renderFriends();
  } catch (err) {
    console.error("Load friends error", err);
  }
}

function setupFilters() {
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.filter;
      renderFriends();
    });
  });
}

function renderFriends() {
  const list = document.getElementById("friendsList");
  list.innerHTML = "";

  let sorted = [...friendsData];

  if (currentFilter === "recent") {
    sorted.sort((a, b) => new Date(b.adddate) - new Date(a.adddate));
  }

  if (currentFilter === "close") {
    sorted.sort((a, b) => b.friend_level - a.friend_level);
  }

  if (currentFilter === "alpha") {
    sorted.sort((a, b) => a.name.localeCompare(b.name));
  }

  sorted.forEach(f => {
    const card = document.createElement("div");
    card.className = "friend-card";

    card.innerHTML = `
      <img src="./default_user.png" class="friend-avatar">

      <div class="friend-info">
        <p class="friend-name">${f.nickname || f.name}</p>
        <p class="friend-meta">
          Joined ${new Date(f.joindate).toLocaleDateString()}
        </p>
      </div>

      <div class="friend-level">
        ❤️ Lv ${f.friend_level}
      </div>
    `;

    list.appendChild(card);
  });
}
