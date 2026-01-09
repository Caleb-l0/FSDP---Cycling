const UserEndPoint = `https://fsdp-cycling-ltey.onrender.com`;
const token = localStorage.getItem("token");

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
   LOAD PUBLIC PROFILE
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

    /* =========================
       HERO
    ========================= */
    document.querySelector(".hvop-name").textContent =
      profile.name ?? "Unknown Volunteer";

    document.querySelector(".hvop-title").textContent =
      getVolunteerTitle(profile.level);

    document.querySelector(".hvop-level").textContent =
      `Level ${profile.level} · ${getVolunteerTier(profile.level)}`;

    document.querySelector(".hvop-followers").textContent =
      `👥 ${getFollowersCount()} Followers`;

    /* =========================
       OVERVIEW
    ========================= */
    setOverviewCard(0, getFollowersCount());
    setOverviewCard(1, profile.total_events ?? 0);
    setOverviewCard(2, getExperienceYears(profile.total_events));

    /* =========================
       BADGES
    ========================= */
    renderBadges(profile.badges);

  } catch (err) {
    console.error("Error fetching user profile:", err);
    alert("Unable to load profile");
  }
}

/* =========================
   HELPERS
========================= */
function getVolunteerTitle(level = 1) {
  if (level >= 10) return "Community Champion";
  if (level >= 6) return "Community Guardian";
  if (level >= 3) return "Active Volunteer";
  return "New Volunteer";
}

function getVolunteerTier(level = 1) {
  if (level >= 10) return "Platinum Volunteer";
  if (level >= 6) return "Gold Volunteer";
  if (level >= 3) return "Silver Volunteer";
  return "Bronze Volunteer";
}

function getFollowersCount() {
  // placeholder（等未来 Followers API）
  return 128;
}

function getExperienceYears(totalEvents = 0) {
  // 粗略推导：5 次活动 ≈ 1 年
  const years = Math.max(1, Math.floor(totalEvents / 5));
  return `${years} Years`;
}

function setOverviewCard(index, value) {
  const cards = document.querySelectorAll(".hvop-overview-card strong");
  if (cards[index]) {
    cards[index].textContent = value;
  }
}

/* =========================
   BADGES
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
