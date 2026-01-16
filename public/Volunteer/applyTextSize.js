// ======================================================
// Apply Text Size Preference to Volunteer Pages
// ======================================================
// This script should be included in all volunteer pages
// to ensure text size preference from profile applies

(function() {
  'use strict';
  
  // Load text size preference on page load
  function loadTextSizePreference() {
    const token = localStorage.getItem("token");
    if (!token) return;
    
    // Check localStorage first (faster)
    const localPreference = localStorage.getItem("happyVolunteerTextSize");
    if (localPreference) {
      applyTextSize(localPreference);
      return;
    }
    
    // If not in localStorage, fetch from backend
    fetch("https://fsdp-cycling-ltey.onrender.com/profile", {
      headers: { "Authorization": `Bearer ${token}` }
    })
    .then(res => res.ok ? res.json() : null)
    .then(data => {
      if (data && data.textSizePreference) {
        const preference = data.textSizePreference;
        localStorage.setItem("happyVolunteerTextSize", preference);
        applyTextSize(preference);
      }
    })
    .catch(err => console.log("Could not load text size preference:", err));
  }
  
  // Apply text size to page
  function applyTextSize(mode) {
    if (mode === 'large' || mode === 'elderly') {
      document.body.classList.add('elderly-mode');
      document.documentElement.setAttribute('data-text-size', 'large');
    } else {
      document.body.classList.remove('elderly-mode');
      document.documentElement.setAttribute('data-text-size', 'normal');
    }
  }
  
  // Run on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadTextSizePreference);
  } else {
    loadTextSizePreference();
  }
})();

