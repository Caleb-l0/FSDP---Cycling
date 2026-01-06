function getLocation() {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser");
    return;
  } 
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            console.log("Latitude:", lat);
            console.log("Longitude:", lng);
            localStorage.setItem("userLat", lat);
            localStorage.setItem("userLng", lng);
        },
        (error) => {
            alert("Error getting location: " + error.message);
        }
    );
}



function AskPosition() {
  const panel = document.createElement('div');
  panel.style.position = 'fixed';
  panel.style.top = '10px';
  panel.style.right = '10px';
  panel.style.padding = '10px';
  panel.style.backgroundColor = 'white';
  panel.style.border = '1px solid black';
  panel.style.zIndex = '1000';
    panel.innerHTML = '<button id="getLocationBtn">Do you allow location access?</button>';
    document.body.appendChild(panel);
    document.getElementById('getLocationBtn').onclick = function() {
        getLocation();
        document.body.removeChild(panel);
    }

}

document.addEventListener('DOMContentLoaded', function() {
    AskPosition();
});

