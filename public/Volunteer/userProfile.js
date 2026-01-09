const API = "https://fsdp-cycling-ltey.onrender.com";
const userId = new URLSearchParams(window.location.search).get("userId");

if (!userId) {
  alert("Invalid profile");
  location.href = "homepage_login_volunteer.html";
}

fetch(`${API}/volunteer/user/profile/${userId}`)
  .then(res => res.json())
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