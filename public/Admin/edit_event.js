const token = localStorage.getItem("token");
const currentEvent = JSON.parse(localStorage.getItem("currentEvent"));

// Check for eventid (database field) or id (fallback), or legacy EventID
if (!token || !currentEvent) {
  window.location.href = "../../index.html";
  throw new Error("No event data");
}

const eventID = currentEvent.eventid || currentEvent.id || currentEvent.EventID;

if (!eventID) {
  window.location.href = "../../index.html";
  throw new Error("No event ID");
}

async function loadEvent() {
  const res = await fetch(`https://fsdp-cycling-ltey.onrender.com/events/${eventID}`, {
    method: "GET",
    headers: { "Authorization": `Bearer ${token}` }
  });

  const data = await res.json();

  // Handle both old format (EventName, EventDate, etc.) and new format (eventname, eventdate, etc.)
  document.getElementById("ev-name").value = data.eventname || data.EventName || "";
  document.getElementById("ev-date").value = (data.eventdate || data.EventDate || "").split("T")[0];
  document.getElementById("ev-loc").value = data.location || data.Location || "";
  document.getElementById("ev-needed").value = data.requiredvolunteers || data.RequiredVolunteers || "";
  document.getElementById("ev-desc").value = data.description || data.Description || "";

  const assignedCheck = await fetch(`https://fsdp-cycling-ltey.onrender.com/events/checkAssigned/${eventID}`, {
    method: "GET",
    headers: { "Authorization": `Bearer ${token}` }
  });

  const assignedInfo = await assignedCheck.json();

  if (assignedInfo.assigned) {
    alert("❌ This event cannot be edited because an organisation is already assigned.");
    disableEditing();
  }
}

function disableEditing() {
  document.querySelectorAll(".edit-input").forEach(i => i.disabled = true);
  document.getElementById("btn-save").disabled = true;
}

document.getElementById("btn-save").addEventListener("click", async () => {
  const body = {
    EventName: document.getElementById("ev-name").value,
    EventDate: document.getElementById("ev-date").value,
    EventLocation: document.getElementById("ev-loc").value,
    RequiredVolunteers: parseInt(document.getElementById("ev-needed").value),
    Description: document.getElementById("ev-desc").value
  };

  const res = await fetch(`https://fsdp-cycling-ltey.onrender.com/events/update/${eventID}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const r = await res.json();
  alert("✔ Event updated!");
  window.location.href = "./admin_event.html";
});

document.getElementById("btn-cancel-edit").addEventListener("click", () => {
  window.location.href = "./admin_event.html";
});

document.addEventListener("DOMContentLoaded", loadEvent);
