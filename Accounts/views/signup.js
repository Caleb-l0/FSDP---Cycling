async function signup(e) {
  e.preventDefault();

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  try {
    // Use the server's signup route. The backend registers POST /signup (not /accounts/signup).
    // Use a relative path so it works in production and when using the same origin.
    const res = await fetch('/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    // Parse response safely: some server errors or mis-routes return HTML (<!DOCTYPE ...) which
    // will throw when calling res.json(). Check the Content-Type first and fall back to text.
    const contentType = res.headers.get('content-type') || '';
    let data;
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      // not JSON - read as text for debugging and create a sensible error object
      const text = await res.text();
      console.warn('Expected JSON but server returned:', text);
      data = { error: text };
    }

    if (res.ok) {
      alert("Signup successful!");
      window.location.href = "login.html";
    } else {
      alert(data.error || "Signup failed");
    }
  } catch (err) {
    console.error("Signup error:", err);
    alert("Something went wrong.");
  }
}

