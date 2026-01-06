const token = localStorage.getItem("token");
if (!token) {
  alert("Please log in first");
  window.location.href = "../../index.html";
}

let signedUp = false;


// Get eventId
const params = new URLSearchParams(window.location.search);
const eventId = params.get("eventId");

if (!eventId) {
  alert("Invalid event ID");
  window.location.href = "./homepage_login_volunteer.html";
}

document.addEventListener("DOMContentLoaded", () => {
  loadEventDetails(eventId);
  checkIsSignedUp(eventId);
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
    document.getElementById("req-org").textContent = data.organizationid || "-";
    document.getElementById("req-date").textContent =
      new Date(data.eventdate).toLocaleString();
      setEventStatus(data.eventdate);
    document.getElementById("req-status").textContent = data.status;
     document.getElementById("req-people-num").textContent = data.maximumparticipant;
    document.getElementById("req-loc").textContent = data.location;
    document.getElementById("req-needed").textContent = data.requiredvolunteers;
    document.getElementById("req-created").textContent = data.createdat
      ? new Date(data.createdat).toLocaleString()
      : "-";
    document.getElementById("req-desc").textContent = data.description || "-";
     
  

  } catch (err) {
    console.error(err);
    alert("Unable to load event details");
  }
}
// check assign

async function checkIsSignedUp(eventId) {
  try {
    const res = await fetch(
      `https://fsdp-cycling-ltey.onrender.com/volunteer/events/isSignedUp/${eventId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    if (!res.ok) throw new Error();

    const data = await res.json();
    signedUp = data.signedUp;

    updateSignupButtonUI();

  } catch (err) {
    console.error("checkIsSignedUp failed", err);
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
// UPDATE SIGNUP BUTTON UI
// ===========================
function updateSignupButtonUI() {
  const btnSignup = document.getElementById("btn-signup");
  const btnCancelSignup = document.getElementById("btn-cancel-signup");

  if (signedUp) {
    btnSignup.style.display = "none";
    btnCancelSignup.style.display = "inline-block";

    btnCancelSignup.onclick = () => cancelSignUp(eventId);

  } else {
    btnSignup.style.display = "inline-block";
    btnCancelSignup.style.display = "none";

    btnSignup.onclick = () =>
      signUp(
        document.getElementById("req-name").textContent,
        eventId
      );
  }
}


// ===========================
// SIGN UP
// ===========================
async function signUp(eventName, eventId) {
  try {
    const res = await fetch(
      `https://fsdp-cycling-ltey.onrender.com/volunteer/events/signup/${eventId}`,
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
      `https://fsdp-cycling-ltey.onrender.com/volunteer/events/signup/${eventId}`,
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



// event status display logic

function setEventStatus(eventDate) {
    const statusEl = document.getElementById("event-status");
    const statusText = statusEl.querySelector("span");
    const statusIcon = statusEl.querySelector("i");

    const now = new Date();
    const start = new Date(eventDate);

    // Default reset
    statusEl.className = "event-status";

    if (start > now) {
        // UPCOMING
        statusEl.classList.add("upcoming");
        statusIcon.className = "fas fa-clock";
        statusText.textContent = "Upcoming Event";
    } else {
        // If within same day → ongoing
        const diffHours = Math.abs(now - start) / (1000 * 60 * 60);

        if (diffHours <= 6) {
            statusEl.classList.add("ongoing");
            statusIcon.className = "fas fa-play-circle";
            statusText.textContent = "Ongoing Now";
        } else {
            statusEl.classList.add("expired");
            statusIcon.className = "fas fa-check-circle";
            statusText.textContent = "Event Ended";
        }
    }
}

