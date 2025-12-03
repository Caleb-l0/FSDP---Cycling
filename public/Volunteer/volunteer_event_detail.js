const token = localStorage.getItem("token");
if (!token) {
    alert("Please log in first");
    window.location.href = "../../index.html";
}


// Get eventId from URL
const urlParams = new URLSearchParams(window.location.search);
const eventId = urlParams.get("eventId");

if (!eventId) {
    alert("Invalid event ID");
    window.location.href = "../Volunteer/volunteer-events.html";
}

document.addEventListener("DOMContentLoaded", () => {
    loadEventDetails(eventId);
});


// ============================
//  LOAD EVENT DETAILS
// ============================
async function loadEventDetails(id) {
    try {
        const res = await fetch(`https://fsdp-cycling-ltey.onrender.com/${id}`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.message || "Failed to load event details");
            return;
        }

        // Fill page
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



// ============================
//  SHOW BUTTONS BASED ON ROLE
// ============================
function displayButtons(eventData) {
    const role = localStorage.getItem("role");  // make sure this exists in login
    
    const btnSignup = document.getElementById("btn-signup");
    const btnCancel = document.getElementById("btn-cancel");
    const btnEdit = document.getElementById("btn-edit");
    const btnDelete = document.getElementById("btn-delete");

    // Volunteer logic
    if (role === "Volunteer") {
        if (eventData.UserSignedUp) {
            btnCancel.style.display = "inline-block";
            btnSignup.style.display = "none";
        } else {
            btnSignup.style.display = "inline-block";
            btnCancel.style.display = "none";
        }

        // Bind signup
        btnSignup.onclick = () => signUp(eventData.EventName, eventData.EventID);
    }

    // Admin logic
    if (role === "Admin" || role === "OrganizationAdmin") {
        btnEdit.style.display = "inline-block";
        btnDelete.style.display = "inline-block";
    }

    // Cancel
    btnCancel.onclick = () => cancelSignUp(eventData.EventID);
}



// ============================
//  SIGN UP FOR EVENT
// ============================
async function signUp(eventTitle, eventId) {
    try {
        const response = await fetch(`https://fsdp-cycling-ltey.onrender.com/events/signup/${eventId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message);
        }

        alert(`🎉 You have successfully signed up for "${eventTitle}"!`);

        setTimeout(() => location.reload(), 500);

    } catch (error) {
        if (error.message.includes('already')) {
            alert('⚠ You already signed up for this event.');
            return;
        }
        alert('❌ Failed to sign up.');
    }
}



// ============================
//  CANCEL SIGN UP
// ============================
async function cancelSignUp(eventId) {
    try {
        const res = await fetch(`https://fsdp-cycling-ltey.onrender.com/events/signup/${eventId}`, {
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

    } catch (err) {
        alert("❌ Failed to cancel sign up.");
    }
}
