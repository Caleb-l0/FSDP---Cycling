async function login(e) {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!email || !password) {
    alert("Please enter both email and password");
    return;
  }

  try {
    const res = await fetch("https://fsdp-cycling-ltey.onrender.com/login", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    let data;
    try {
      data = await res.json();
    } catch (jsonError) {
      console.error("Failed to parse JSON response:", jsonError);
      const textResponse = await res.text();
      console.error("Raw response:", textResponse);
      alert("Server error: Invalid response format");
      return;
    }

    if (res.ok) {
      alert("Login successful!");
      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("name", data.name);
      localStorage.setItem("email", data.email);
      localStorage.setItem("role", data.role);
      
      // Redirect based on role
      setTimeout(() => {
        switch(data.role) {
          case 'admin':
            window.location.href = '/public/Admin/homepage_login_Admin.html';
            break;
          case 'volunteer':
            window.location.href = '/public/Volunteer/homepage_login_volunteer.html';
            break;
          case 'institution':
            window.location.href = '/public/Instituition/homepage_login_instituition.html';
            break;
          default:
            window.location.href = '/';
        }
      }, 1000);
    } else {
      console.error("Login failed - Status:", res.status, "Error:", data);
      alert(data.error || data.message || "Login failed. Please check your credentials.");
    }
  } catch (err) {
    console.error("Login error:", err);
    alert("Network error: Could not connect to server. Please try again.");
  }
}
