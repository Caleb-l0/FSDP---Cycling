const token = localStorage.getItem("token");
const eventID = JSON.parse(localStorage.getItem("currentRequest")).EventID;

if (!token || !eventID) window.location.href = "login.html";

async function loadEvent() {
  const res = await fetch(`http://localhost:3000/${eventID}`, {
    method: "GET",
    headers: { "Authorization": `Bearer ${token}` }
  });

  const data = await res.json();

  document.getElementById("ev-name").value = data.EventName;
  document.getElementById("ev-date").value = data.EventDate.split("T")[0];
  document.getElementById("ev-loc").value = data.Location;
  document.getElementById("ev-needed").value = data.RequiredVolunteers;
  document.getElementById("ev-desc").value = data.Description;

  const assignedCheck = await fetch(`http://localhost:3000/events/checkAssigned/${eventID}`, {
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

  const res = await fetch(`http://localhost:3000/events/update/${eventID}`, {
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
