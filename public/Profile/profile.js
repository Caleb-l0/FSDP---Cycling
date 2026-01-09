const token = localStorage.getItem("token");
let userRole = null;
const textSizeButtons = document.querySelectorAll('[data-text-size]');
let selectedTextSize = (window.getTextSizePreference ? window.getTextSizePreference() : localStorage.getItem("happyVolunteerTextSize")) || "normal";

if (!token) {
  alert("You must be logged in to access this page.");
  window.location.href = "../../index.html";
}


// Translate page


// Load profile
async function loadProfile() {
  try {
    const response = await fetch("https://fsdp-cycling-ltey.onrender.com/profile", {
      method: "GET",
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("Unauthorized");

    const data = await response.json();
    const userData = data.user || data;

    document.getElementById("name").value = userData.name || "";
    document.getElementById("email").value = userData.email || "";
    document.getElementById("role").textContent = userData.role || "";

    selectedTextSize = data.textSizePreference || selectedTextSize;
    updateTextSizeButtons(selectedTextSize);
    if (window.setTextSizePreference) {
      window.setTextSizePreference(selectedTextSize);
    } else {
      localStorage.setItem("happyVolunteerTextSize", selectedTextSize);
    }

    userRole = data.role.toLowerCase();
    loadHeaderByRole();

  } catch (err) {
    console.error(err);
    alert("Session expired — please log in again.");
    window.location.href='../../index.html'
  }
}
loadProfile();

// Dynamic header based on role


// Logo redirect
function attachLogoRedirect(role) {
  const logo = document.getElementById("logoRedirect");
  if (!logo) return;

  logo.addEventListener("click", function(e) {
    e.preventDefault();
    if (role === "volunteer") window.location.href = "homepage_login_volunteer.html";
    else if (role === "admin") window.location.href = "homepage_login_admin.html";
    else if (role === "institution" || role === "instituition") window.location.href = "homepage_login_instituition.html";
    else window.location.href = "homepage.html";
  });
}

// Edit / Save
const nameField = document.getElementById("name");
const emailField = document.getElementById("email");
const editBtn = document.getElementById("editBtn");
const saveBtn = document.getElementById("saveBtn");
const translate = document.getElementById("translate")

function updateTextSizeButtons(mode) {
  textSizeButtons.forEach((button) => {
    const isSelected = button.dataset.textSize === mode;
    button.setAttribute("aria-pressed", String(isSelected));
    button.classList.toggle("active", isSelected);
  });
}

async function handleTextSizeChange(mode) {
  if (!mode || mode === selectedTextSize) return;
  try {
    const response = await fetch("https://fsdp-cycling-ltey.onrender.com/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ textSizePreference: mode })
    });

    if (!response.ok) throw new Error("Text size update failed");

    selectedTextSize = mode;
    updateTextSizeButtons(mode);
    if (window.setTextSizePreference) {
      window.setTextSizePreference(mode);
    } else {
      localStorage.setItem("happyVolunteerTextSize", mode);
    }
    alert("Text size updated across the site.");
  } catch (err) {
    console.error(err);
    alert("Unable to update text size.");
  }
}


editBtn.addEventListener("click", () => {
  nameField.disabled = false;
  emailField.disabled = false;
  editBtn.style.display = "none";
  saveBtn.style.display = "inline-block";
});

saveBtn.addEventListener("click", async () => {
  const newName = nameField.value;
  const newEmail = emailField.value;

  try {
    const response = await fetch("https://fsdp-cycling-ltey.onrender.com/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ name: newName, email: newEmail, textSizePreference: selectedTextSize })
    });

    if (!response.ok) throw new Error("Update failed");

    alert("Profile updated successfully!");
    nameField.disabled = true;
    emailField.disabled = true;
    editBtn.style.display = "inline-block";
    saveBtn.style.display = "none";

  } catch (err) {
    console.error(err);
    alert("Error updating profile.");
  }
});

// Logout button
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.clear();
  alert("Logged out successfully!");
  window.location.href = "/index.html";
});









textSizeButtons.forEach((button) =>
  button.addEventListener("click", () => handleTextSizeChange(button.dataset.textSize))
);

updateTextSizeButtons(selectedTextSize);

// --- nav bar section 
function getUserRoleFromToken() {
  const token = localStorage.getItem("token");
  if (!token) return null;

  const payload = token.split(".")[1];
  const decoded = JSON.parse(atob(payload));

  return decoded.role;   
}





function loadHeaderByRole() {

  const mainNav = document.getElementById("mainNav");   // Desktop
  const mobileNav = document.getElementById("hvNav");   // Mobile
  const logo = document.getElementById("logoRedirect");
  const role = getUserRoleFromToken();

  let navHTML = "";
  let logoHref = "";

  // ADMIN
  if (role === "admin") {
    navHTML = `
      <ul>
        <li><a href="../Admin/createEvent.html">Create Event</a></li>
        <li><a href="#">Notification</a></li>
        <li><a href="#">History</a></li>
        <li><a href="./profilepage.html">Profile</a></li>
      </ul>`;
    logoHref = "../Admin/homepage_login_Admin.html";
  }

  // VOLUNTEER
  if (role === "volunteer") {
    navHTML = `
      <ul>
                <li><a href="./volunteer-events.html">Booking</a></li>
                <li><a href="./volunteer_community_page.html">Community</a></li>
                <li><a href="./volunteer_rewards.html">Reward</a></li>
                <li><a href="./Volunteer_friend.html">Friends</a></li>
                <li><a href="../Profile/profilepage.html">Profile</a></li>
      </ul>`;
    logoHref = "../Volunteer/homepage_login_volunteer.html";
  }

  // INSTITUTION
  if (role === "institution") {
    navHTML = `
      <ul>
        <li><a href="../Instituition/organization_apply_event.html">Apply Event</a></li>
        <li><a href="#">Community</a></li>
        <li><a href="#">Notification</a></li>
        <li><a href="#">History</a></li>
        <li><a href="./profilepage.html">Profile</a></li>
      </ul>`;
    logoHref = "../Instituition/homepage_login_instituition.html";
  }

 
  mainNav.innerHTML = navHTML;
  mobileNav.innerHTML = navHTML;


  logo.href = logoHref;
}
