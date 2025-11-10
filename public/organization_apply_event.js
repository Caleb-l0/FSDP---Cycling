  document.getElementById("eventRequestForm").addEventListener("submit", async function(e) {
      e.preventDefault();

      const submitBtn = form.querySelector("button[type='submit']");
      const msgBox = document.getElementById("messageBox");

      const formData = {
        eventName: document.getElementById("eventName").value.trim(),
        eventDate: document.getElementById("eventDate").value,
        description: document.getElementById("description").value.trim(),
        requiredVolunteers: document.getElementById("requiredVolunteers").value,
        specialInvite: document.getElementById("specialInvite").value.trim()
      };

      for (const [key, value] of Object.entries(formData)) {
        if (!value) {
          msgBox.innerHTML = `<p class="error-message">⚠️ Please fill in all fields before submitting.</p>`;
          return;
        }
      }

      submitBtn.disabled = true;
      msgBox.innerHTML = `<p class="loading-message">⏳ Submitting your request...</p>`;

      try {
        const res = await fetch("http://localhost:3000/api/volunteerRequests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        });

        const data = await res.json();

        if (res.ok) {
          msgBox.innerHTML = `<p class="success-message">✅ Request submitted successfully!</p>`;
          form.reset();
        } else if (res.status === 400) {
          msgBox.innerHTML = `<p class="error-message">⚠️ Invalid input. Please check your form.</p>`;
        } else if (res.status === 500) {
          msgBox.innerHTML = `<p class="error-message">💥 Server error. Please try again later.</p>`;
        } else {
          msgBox.innerHTML = `<p class="error-message">❌ ${data.message || 'Submission failed.'}</p>`;
        }
      } catch (err) {
        console.error(err);
        document.getElementById("messageBox").innerHTML = 
        `<p class="error-message">❌ Network error. Please try again later.</p>`;
      } finally {
        submitBtn.disabled = false;
      }
    });