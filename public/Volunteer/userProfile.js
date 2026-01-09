const UserEndPoint = `https://fsdp-cycling-ltey.onrender.com`;
const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "../../index.html";
}

/* =========================
   SECTION SWITCH
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
const addBtn = document.getElementById("hvop-add-friend-btn");
addBtn.onclick = () => {
  if (addBtn.classList.contains("added")) return;
  addBtn.textContent = "✔ Friends";
  addBtn.classList.add("added");
};

/* =========================
   GET USER ID
========================= */
const userId = new URLSearchParams(window.location.search).get("userId");

/* =========================
   FETCH PUBLIC PROFILE
========================= */
async function loadPublicProfile(id) {
  try {
    const res = await fetch(
      `${UserEndPoint}/volunteer/user/profile/${id}`
    );

    if (!res.ok) {
      throw new Error("Failed to fetch profile");
    }

    const profile = await res.json();
    console.log("Public profile:", profile);

    /* ===== BASIC INFO ===== */
    document.getElementById("hvop-username").textContent =
      profile.name;

    document.getElementById("hvop-total-events").textContent =
      profile.total_events;

    /* ===== BADGES ===== */
    renderBadges(profile.badges);

  } catch (err) {
    console.error("Error fetching user profile:", err);
    alert("Unable to load profile");
  }
}

/* =========================
   RENDER BADGES
========================= */
function renderBadges(badges) {
  const grid = document.getElementById("hvop-badge-grid");
  const emptyText = document.getElementById("hvop-no-badges");

  grid.innerHTML = "";

  if (!badges || badges.length === 0) {
    emptyText.style.display = "block";
    return;
  }

  emptyText.style.display = "none";

  badges.forEach(badge => {
    const card = document.createElement("div");
    card.className = "hvop-badge-card";

    const icon = document.createElement("div");
    icon.className = "hvop-badge-icon";

    if (badge.iconurl) {
      const img = document.createElement("img");
      img.src = badge.iconurl;
      img.alt = badge.badgename;
      icon.appendChild(img);
    } else {
      icon.textContent = "🏅";
    }

    const name = document.createElement("div");
    name.className = "hvop-badge-name";
    name.textContent = badge.badgename;

    card.appendChild(icon);
    card.appendChild(name);
    grid.appendChild(card);
  });
}

/* =========================
   INIT
========================= */
if (userId) {
  loadPublicProfile(userId);
} else {
  alert("Invalid user");
}
