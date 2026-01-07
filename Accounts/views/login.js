async function login(e) {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const rememberMe = document.getElementById('rememberMe').checked;
  const otp = document.getElementById('otp').value;

  const btn = document.getElementById('loginBtn');

  if (btn.textContent === 'Verify OTP') {
    // Verify OTP
    try {
      const res = await fetch("http://localhost:3000/verify-otp", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, rememberMe })
      });

      const data = await res.json();

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
              window.location.href = '/public/homepage_login_Admin.html';
              break;
            case 'volunteer':
              window.location.href = '/public/homepage_login_volunteer.html';
              break;
            case 'institution':
              window.location.href = '/public/homepage_login_instituition.html';
              break;
            default:
              window.location.href = '/';
          }
        }, 1000);
      } else {
        alert(data.error || "Verification failed");
      }
    } catch (err) {
      console.error("Verification error:", err);
      alert("Something went wrong.");
    }
  } else {
    // Login with password
    try {
      const res = await fetch("http://localhost:3000/login", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe })
      });

      const data = await res.json();

      if (res.ok && data.message === "OTP sent to your email") {
        document.getElementById('otp').style.display = 'block';
        btn.textContent = 'Verify OTP';
        alert("OTP sent to your email. Enter it below.");
      } else if (res.ok) {
        // If no OTP, direct login
        alert("Login successful!");
        localStorage.setItem("token", data.token);
        // ... rest
      } else {
        alert(data.error || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("Something went wrong.");
    }
  }
}
