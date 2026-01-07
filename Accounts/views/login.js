async function login(e) {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  try {
    const res = await fetch("http://localhost:3000/login", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
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
      alert(data.error || "Login failed");
    }
  } catch (err) {
    console.error("Login error:", err);
    alert("Something went wrong.");
  }
}
