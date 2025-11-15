require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// ----- MIDDLEWARE -----
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/public', express.static(path.join(__dirname, 'public'))); // header, images, etc.
app.use('/Accounts/views', express.static(path.join(__dirname, 'Accounts/views'))); // login.html, signup.html
app.use(express.static(__dirname)); // index.html, index.css, root images, etc.

// ----- LOGIN ROUTES -----
const { loginUser, getUserById, updateUser, deleteUser } = require('./Accounts/login/loginController');
const { validateLogin } = require('./Accounts/login/loginValidation');
const { authenticate } = require('./Accounts/login/authenticate');

// ----- REQUEST CONTROLLER -----
const requestController = require('./Controllers/GetRequestController');

// ----- ADMIN EVENT CONTROLLER -----
const adminEventController = require('./Controllers/Admin_event_Controller');

// ----- LOGIN -----
app.post('/login', validateLogin, loginUser);
app.get('/user/:id', authenticate, getUserById);
app.put('/user/:id', authenticate, updateUser);
app.delete('/user/:id', authenticate, deleteUser);

// ----- SIGNUP ROUTES -----
const { signupUser } = require('./Accounts/signup/signupController');
const { validateSignup } = require('./Accounts/signup/signupValidation');

app.post('/signup', validateSignup, signupUser);

// ----- HTML PAGES -----
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'Accounts/views/login.html')));
app.get('/signup', (req, res) => res.sendFile(path.join(__dirname, 'Accounts/views/signup.html')));

// ----- PROFILE PAGE -----
app.get("/api/profile", authenticate, async (req, res) => {
  res.json({
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role
  });
});

// UPDATE PROFILE
app.put("/api/profile", authenticate, async (req, res) => {
  const { name, email } = req.body;

  try {
    const result = await require("./Accounts/login/loginModel")
      .updateUser(req.user.id, name, email);

    res.json({ message: "Profile updated successfully!" });

  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ message: "Failed to update profile." });
  }
});




// ----- REQUEST ROUTES -----
app.get('/admin/applications', authenticate, requestController.getAllRequests);
app.get('/requests/details/:id', authenticate, requestController.getRequestById);

// ----- ADMIN EVENT ROUTES -----
app.get('/admin/events', authenticate, adminEventController.getAllEvents);
app.post('/admin/create_events', authenticate, adminEventController.createEvent);

// ----- START SERVER -----
app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
});
