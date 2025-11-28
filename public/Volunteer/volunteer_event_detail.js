const token = localStorage.getItem("token");
if (!token) {
    alert("Please log in first");
    window.location.href = "../../index.html";
}

const urlParams = new URLSearchParams(window.location.search);
const eventId = urlParams.get("eventId");

if (!eventId) {
    alert("Invalid event ID");
    window.location.href = "../Volunteer/volunteer-events.html";
}

document.addEventListener("DOMContentLoaded", () => {
    loadEventDetails(eventId);
});

async function loadEventDetails(id) {
    try {
        const res = await fetch(`http://localhost:3000/${id}`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });

        const data = await res.json();
        console.log(data);

        if (!res.ok) {
            alert(data.message || "Failed to load event details");
            return;
        }

        document.getElementById("req-name").textContent = data.EventName;
        document.getElementById("req-date").textContent = new Date(data.EventDate).toLocaleString();
        document.getElementById("req-org").textContent = data.OrganizationName || "-";
        document.getElementById("req-created").textContent = new Date(data.CreatedAt).toLocaleString();
        document.getElementById("req-loc").textContent = data.Location;
        document.getElementById("req-needed").textContent = data.RequiredVolunteers;
        document.getElementById("req-user").textContent = data.EventID;
        document.getElementById("req-desc").textContent = data.Description || "-";

     
        displayButtons(data);

    } catch (err) {
        console.error(err);
        alert("Failed to load event");
    }
}



function displayButtons(eventData) {
    const role = localStorage.getItem("role"); 
    const btnSignup = document.getElementById("btn-signup");
    const btnCancel = document.getElementById("btn-cancel");
    const btnEdit = document.getElementById("btn-edit");
    const btnDelete = document.getElementById("btn-delete");

    // Volunteer 
    if (role === "Volunteer") {

        if (eventData.UserSignedUp) {
            btnCancel.style.display = "inline-block";
            btnSignup.style.display = "none";
        } else {
            btnSignup.style.display = "inline-block";
            btnCancel.style.display = "none";
        }
    }

    // Admin 
    if (role === "Admin" || role === "OrganizationAdmin") {
        btnEdit.style.display = "inline-block";
        btnDelete.style.display = "inline-block";
    }

 

    // Cancel
    btnCancel.onclick = () => cancelSignUp(eventData.EventID);
}


async function signUp(eventTitle, eventId) {
  const token = localStorage.getItem('token');
  
  if (!token) {
    alert('Please login first');
    window.location.href = '../../index.html';
    return;
  }

  try {
    const response = await fetch(`http://localhost:3000/events/signup`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ eventId })  
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message);
    }

    alert(`🎉 You have successfully signed up for "${eventTitle}"!`);

    setTimeout(() => {
      location.reload();
    }, 500);

  } catch (error) {
    if (error.message.includes('already')) {
      alert('⚠ You already signed up for this event.');
      return;
    }

    alert('❌ Failed to sign up.');
  }
}



async function cancelSignUp(eventId) {
    const res = await fetch(`http://localhost:3000/events/${eventId}/signup`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    });

    const data = await res.json();

    if (!res.ok) {
        alert(data.message || "Failed to cancel");
        return;
    }

    alert("You have cancelled your sign-up.");
    location.reload();
}

