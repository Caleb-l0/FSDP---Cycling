  document.getElementById("eventRequestForm").addEventListener("submit", async function(e) {
      e.preventDefault();

      const formData = {
        eventName: document.getElementById("eventName").value,
        eventDate: document.getElementById("eventDate").value,
        description: document.getElementById("description").value,
        requiredVolunteers: document.getElementById("requiredVolunteers").value,
        specialInvite: document.getElementById("specialInvite").value
      };

      try {
        const res = await fetch("http://localhost:3000/api/volunteerRequests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        });

        const data = await res.json();
        const msgBox = document.getElementById("messageBox");

        if (res.ok) {
          msgBox.innerHTML = `<p class="success-message">✅ Your request has been submitted successfully!</p>`;
          document.getElementById("eventRequestForm").reset();
        } else {
          msgBox.innerHTML = `<p class="error-message">❌ ${data.message || 'Submission failed.'}</p>`;
        }
      } catch (err) {
        document.getElementById("messageBox").innerHTML =
          `<p class="error-message">❌ Network error. Please try again later.</p>`;
        console.error(err);
      }
    });