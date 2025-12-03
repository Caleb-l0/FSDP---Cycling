// =====================
// BOOKING MODAL LOGIC
// =====================

const bookingModal = document.getElementById("bookingModal");
const closeModal = document.getElementById("closeModal");
const participantsInput = document.getElementById("participantsInput");
const bookingMessage = document.getElementById("bookingMessage");
const submitBookingBtn = document.getElementById("submitBookingBtn");

let selectedEventId = null;

// OPEN MODAL WHEN EVENT CLICKED
document.querySelector(".detail").addEventListener("click", function () {
    selectedEventId = 1; // <-- CHANGE IF YOU FETCH EVENTS DYNAMICALLY
    document.getElementById("modalEventName").textContent = "Book Event #1";
    bookingModal.style.display = "flex";
});

// CLOSE MODAL
closeModal.onclick = () => bookingModal.style.display = "none";
window.onclick = e => { if (e.target === bookingModal) bookingModal.style.display = "none"; };


// =====================
// SEND BOOKING REQUEST
// =====================
submitBookingBtn.addEventListener("click", async () => {
    const participants = parseInt(participantsInput.value);
    const organizationId = localStorage.getItem("organizationId");
    const token = localStorage.getItem("token");

    if (!participants || participants <= 0) {
        bookingMessage.style.color = "red";
        bookingMessage.textContent = "Enter a valid number!";
        return;
    }

    const response = await fetch(`/https://fsdp-cycling-ltey.onrender.com/events/${selectedEventId}/book`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
            organizationId,
            participants
        })
    });

    const data = await response.json();

    if (response.ok) {
        bookingMessage.style.color = "green";
        bookingMessage.textContent = "Booking successful!";
        setTimeout(() => bookingModal.style.display = "none", 1500);
    } else {
        bookingMessage.style.color = "red";
        bookingMessage.textContent = data.message || "Booking failed";
    }
});
