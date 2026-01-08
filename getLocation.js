function getLocation() {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      localStorage.setItem("userLat", lat);
      localStorage.setItem("userLng", lng);

      console.log("Latitude:", lat);
      console.log("Longitude:", lng);
    },
    (error) => {
      alert("Unable to retrieve your location.");
    }
  );
}

function showLocationPrompt() {
 
  if (localStorage.getItem("locationAsked")) return;

  const panel = document.createElement("div");
  panel.className = "hvloc-panel";

  panel.innerHTML = `
    <h3>📍 Enable Location</h3>
    <p>
      We use your location to recommend nearby volunteer activities
      and improve your experience.
    </p>
    <div class="hvloc-actions">
      <button class="hvloc-btn primary" id="hvloc-allow">
        Allow Location
      </button>
      <button class="hvloc-btn secondary" id="hvloc-deny">
        Not Now
      </button>
    </div>
  `;

  document.body.appendChild(panel);

  document.getElementById("hvloc-allow").onclick = () => {
    getLocation();
    localStorage.setItem("locationAsked", "true");
    panel.remove();
  };

  document.getElementById("hvloc-deny").onclick = () => {
    localStorage.setItem("locationAsked", "true");
    panel.remove();
  };
}

document.addEventListener("DOMContentLoaded", showLocationPrompt);
