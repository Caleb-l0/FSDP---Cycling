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

let originalEventDate = null;

async function loadEvent() {
  try {
    const res = await fetch(`https://fsdp-cycling-ltey.onrender.com/events/${eventID}`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!res.ok) {
      throw new Error("Failed to fetch event details");
    }

    const data = await res.json();

    // Handle both old format (EventName, EventDate, etc.) and new format (eventname, eventdate, etc.)
    document.getElementById("ev-name").value = data.eventname || data.EventName || "";
    
    // Store original date for time preservation
    originalEventDate = data.eventdate || data.EventDate || "";
    // Extract date part for date input (YYYY-MM-DD)
    const dateValue = originalEventDate ? originalEventDate.split("T")[0] : "";
    document.getElementById("ev-date").value = dateValue;
    
    document.getElementById("ev-loc").value = data.location || data.Location || "";
    document.getElementById("ev-needed").value = data.requiredvolunteers || data.RequiredVolunteers || "";
    document.getElementById("ev-desc").value = data.description || data.Description || "";

    const assignedCheck = await fetch(`https://fsdp-cycling-ltey.onrender.com/events/checkAssigned/${eventID}`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!assignedCheck.ok) {
      console.error("Failed to check assignment status");
      return;
    }

    const assignedInfo = await assignedCheck.json();

    if (assignedInfo.assigned) {
      alert("❌ This event cannot be edited because an organisation is already assigned.");
      disableEditing();
    }
  } catch (error) {
    console.error("Error loading event:", error);
    alert("❌ Error loading event details: " + error.message);
  }
}

function disableEditing() {
  document.querySelectorAll(".edit-input").forEach(i => i.disabled = true);
  document.getElementById("btn-save").disabled = true;
}

document.getElementById("btn-save").addEventListener("click", async () => {
  try {
    const eventName = document.getElementById("ev-name").value.trim();
    const eventDateInput = document.getElementById("ev-date").value;
    const eventLocation = document.getElementById("ev-loc").value.trim();
    const requiredVolunteers = parseInt(document.getElementById("ev-needed").value);
    const description = document.getElementById("ev-desc").value.trim();

    // Validate required fields
    if (!eventName) {
      alert("❌ Event name is required");
      return;
    }

    if (!eventDateInput) {
      alert("❌ Event date is required");
      return;
    }

    // Preserve time from original date if available, otherwise use midnight
    let eventDate = eventDateInput;
    if (originalEventDate && originalEventDate.includes("T")) {
      // Extract time from original date
      const originalTime = originalEventDate.split("T")[1] || "00:00:00";
      eventDate = eventDateInput + "T" + originalTime.split(".")[0]; // Remove milliseconds if present
    } else {
      // No original time, use midnight
      eventDate = eventDateInput + "T00:00:00";
    }

    const body = {
      EventName: eventName,
      EventDate: eventDate,
      EventLocation: eventLocation,
      RequiredVolunteers: requiredVolunteers,
      Description: description
    };

    const res = await fetch(`https://fsdp-cycling-ltey.onrender.com/events/update/${eventID}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: "Unknown error" }));
      alert("❌ Error: " + (errorData.message || errorData.error || "Failed to update event"));
      return;
    }

    const r = await res.json();
    alert("✔ Event updated successfully!");
    window.location.href = "./admin_event.html";
  } catch (error) {
    console.error("Error updating event:", error);
    alert("❌ Error: " + (error.message || "Failed to update event"));
  }
});

document.getElementById("btn-cancel-edit").addEventListener("click", () => {
  window.location.href = "./admin_event.html";
});

document.addEventListener("DOMContentLoaded", loadEvent);
