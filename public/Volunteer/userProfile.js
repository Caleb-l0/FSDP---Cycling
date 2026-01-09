

const UserEndPoint = `https://fsdp-cycling-ltey.onrender.com`;
const token = localStorage.getItem('token');

if (!token) {
  window.location.href = '../../index.html';
}

// Section switch
document.querySelectorAll(".hvop-nav-btn").forEach(btn=>{
  btn.onclick=()=>{
    document.querySelectorAll(".hvop-nav-btn,.hvop-panel")
      .forEach(el=>el.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.target).classList.add("active");
  };
});

// Add friend interaction
const addBtn = document.getElementById("hvop-add-friend-btn");
addBtn.onclick = ()=>{
  if(addBtn.classList.contains("added")) return;
  addBtn.textContent = "✔ Friends";
  addBtn.classList.add("added");
};

const userId = URLSearchParams
  ? new URLSearchParams(window.location.search).get("userId")
  : null;

async function GetUserId(id) {
  try {
    const res = await fetch(
      `${UserEndPoint}/volunteer/user/profile/${id}`,
      {
        method: "GET",

      }
    );

    if (!res.ok) {
      throw new Error("Failed to fetch profile");
    }

    const userProfile = await res.json();
    console.log(userProfile);

    
    document.getElementById("hvop-username").textContent =
      userProfile.userInfo.name;

    document.getElementById("hvop-email").textContent =
      userProfile.userInfo.email;

    document.getElementById("hvop-joindate").textContent =
      new Date(userProfile.userInfo.joindate).toLocaleDateString();

  
    document.getElementById("hvop-total-events").textContent =
      userProfile.userExperience.total_events;

    document.getElementById("hvop-first-event-date").textContent =
      userProfile.userExperience.first_event_date
        ? new Date(userProfile.userExperience.first_event_date).toLocaleDateString()
        : "N/A";

    /* ===== Events ===== */
    const eventsList = document.getElementById("hvop-events-list");
    eventsList.innerHTML = "";

    userProfile.userEvents.forEach(event => {
      const li = document.createElement("li");
      li.textContent = `${event.eventname} · ${new Date(event.eventdate).toLocaleDateString()} · ${event.location}`;
      eventsList.appendChild(li);
    });

    /* ===== Badges ===== */
    renderBadges(userProfile.userBadge);

  } catch (err) {
    console.error("Error fetching user profile:", err);
    alert("Unable to load profile");
  }
}

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

    // icon
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

    // name
    const name = document.createElement("div");
    name.className = "hvop-badge-name";
    name.textContent = badge.badgename;

    // description
    const desc = document.createElement("div");
    desc.className = "hvop-badge-desc";
    desc.textContent = badge.description || "";

    // date
    const date = document.createElement("div");
    date.className = "hvop-badge-meta";
    date.textContent = `Earned: ${new Date(badge.getdate).toLocaleDateString()}`;

    card.appendChild(icon);
    card.appendChild(name);
    card.appendChild(desc);
    card.appendChild(date);

    grid.appendChild(card);
  });
}

async function fetchUserBadges(userId) {
  const res = await fetch(
    `${UserEndPoint}/volunteer/user/profile/${userId}`,
    {
      method: "GET",
      
    }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch user profile");
  }

  const data = await res.json();
  return data.userBadge || [];
}

(async function initBadges() {
  try {
    const badges = await fetchUserBadges(userId);
    renderBadges(badges);
  } catch (err) {
    console.error("Badge load error:", err);
  }
})();


GetUserId(userId);