const token = localStorage.getItem("token");
if (!token) {
  alert("Please log in first");
  window.location.href = "../../index.html";
}

// Get eventId
const params = new URLSearchParams(window.location.search);
const eventId = params.get("eventId");

if (!eventId) {
  alert("Invalid event ID");
  window.location.href = "./homepage_login_volunteer.html";
}

document.addEventListener("DOMContentLoaded", () => {
  loadEventDetails(eventId);
});

// ===========================
// LOAD EVENT DETAILS
// ===========================
async function loadEventDetails(id) {
  try {
    const res = await fetch(
      `https://fsdp-cycling-ltey.onrender.com/volunteer/events/${id}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    
    if (!res.ok) throw new Error("Failed to load event");
    const data = await res.json();
    document.getElementById("req-name").textContent = data.eventname;
    document.getElementById("req-org").textContent = data.organizationname || "-";
    document.getElementById("req-date").textContent =
      new Date(data.eventdate).toLocaleString();
    document.getElementById("req-loc").textContent = data.location;
    document.getElementById("req-needed").textContent = data.requiredvolunteers;
    document.getElementById("req-id").textContent = data.eventid;
    document.getElementById("req-desc").textContent = data.description || "-";

    setupButtons(data);

  } catch (err) {
    console.error(err);
    alert("Unable to load event details");
  }
}

// ===========================
// BUTTON LOGIC
// ===========================
function setupButtons(eventData) {
  const btnSignup = document.getElementById("btn-signup");
  const btnCancel = document.getElementById("btn-cancel");

  if (eventData.usersignedup) {
    btnSignup.style.display = "none";
    btnCancel.style.display = "inline-block";
  } else {
    btnSignup.style.display = "inline-block";
    btnCancel.style.display = "none";
  }

  btnSignup.onclick = () =>
    signUp(eventData.eventname, eventData.eventid);

  btnCancel.onclick = () =>
    cancelSignUp(eventData.eventid);
}

// ===========================
// SIGN UP
// ===========================
async function signUp(eventName, eventId) {
  try {
    const res = await fetch(
      `https://fsdp-cycling-ltey.onrender.com/events/signup/${eventId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );

    if (!res.ok) throw new Error();

    alert(`You have signed up for "${eventName}"`);
    location.reload();

  } catch {
    alert("You already signed up or failed.");
  }
}

// ===========================
// CANCEL SIGN UP
// ===========================
async function cancelSignUp(eventId) {
  try {
    const res = await fetch(
      `https://fsdp-cycling-ltey.onrender.com/events/signup/${eventId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (!res.ok) throw new Error();

    alert("You have cancelled your sign-up.");
    location.reload();

  } catch {
    alert("Failed to cancel sign-up.");
  }
}
