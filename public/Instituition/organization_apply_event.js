document.getElementById("eventRequestForm").addEventListener("submit", async function(e) {
  e.preventDefault();

  const token = localStorage.getItem("token");
  const orgId = localStorage.getItem("organizationId");

  const payload = {
    OrganizationID: orgId,
    EventName: document.getElementById("eventName").value,
    EventDate: document.getElementById("eventDate").value,
    Description: document.getElementById("description").value,
    RequiredVolunteers: parseInt(document.getElementById("requiredVolunteers").value)
  };

  const response = await fetch("http://localhost:3000/request-event", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (response.ok) {
    alert("Request submitted successfully!");
  } else {
    alert(data.message || "Request failed");
  }
});
