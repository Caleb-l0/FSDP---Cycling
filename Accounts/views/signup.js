document.querySelector('#signupForm').addEventListener('submit', signup);

async function signup(e) {
  e.preventDefault();

  const username = document.querySelector('#username-signup').value.trim();
  const email = document.querySelector('#email-signup').value.trim();
  const password = document.querySelector('#password-signup').value.trim();

  if (username && email && password) {
    const response = await fetch('/api/users/signup', {
      method: 'POST',
      body: JSON.stringify({ name: username, email, password }),
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await response.json();

    if (response.ok) {
      alert('Signup successful! Please log in.');
      
      window.location.href = '/login.html';
    } else {
      alert(data.message || 'Failed to sign up.');
    }
  }
}
