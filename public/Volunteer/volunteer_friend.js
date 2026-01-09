const token = localStorage.getItem("volunteerToken");
if (!token) {
  alert("Please log in first");
  window.location.href = "../../index.html";
}

