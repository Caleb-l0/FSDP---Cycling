require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(__dirname)); // index.html, index.css, images, etc.
app.use('/Accounts/views', express.static(path.join(__dirname, 'Accounts/views'))); // login.html, signup.html

// ----- LOGIN ROUTES -----
const { loginUser, getUserById, updateUser, deleteUser } = require('./Accounts/login/loginController');
const { validateLogin } = require('./Accounts/login/loginValidation');
const { authenticate } = require('./Accounts/login/authenticate');

app.post('/login', validateLogin, loginUser);
app.get('/user/:id', authenticate, getUserById);
app.put('/user/:id', authenticate, updateUser);
app.delete('/user/:id', authenticate, deleteUser);

// ----- SIGNUP ROUTES -----
const { signupUser } = require('./Accounts/signup/signupController');
const { validateSignup } = require('./Accounts/signup/signupValidation');

app.post('/signup', validateSignup, signupUser);

// ----- Event Routes -----
const { submitEventRequest } = require("./Accounts/events/eventController");
const { validateEventRequest } = require("./Accounts/events/eventValidation");

app.post("/api/volunteerRequests", validateEventRequest, submitEventRequest);

// ----- HTML PAGES -----
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'Accounts/views/login.html')));
app.get('/signup', (req, res) => res.sendFile(path.join(__dirname, 'Accounts/views/signup.html')));

// Start server
app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
});

// ===== TEMPORARY TEST ROUTE FOR VOLUNTEER REQUESTS =====
const sql = require("mssql");
const dbConfig = require("./database"); // adjust path if needed

app.post("/api/volunteerRequests", async (req, res) => {
  try {
    const { eventName, eventDate, description, requiredVolunteers, specialInvite } = req.body;

    // Basic validation
    if (!eventName || !eventDate || !description || !requiredVolunteers) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    // Connect and insert into DB
    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input("eventName", sql.NVarChar, eventName)
      .input("eventDate", sql.Date, eventDate)
      .input("description", sql.NVarChar, description)
      .input("requiredVolunteers", sql.Int, requiredVolunteers)
      .input("specialInvite", sql.NVarChar, specialInvite || "")
      .query(`
        INSERT INTO VolunteerRequests (EventName, EventDate, Description, RequiredVolunteers, SpecialInvite)
        VALUES (@eventName, @eventDate, @description, @requiredVolunteers, @specialInvite)
      `);

    res.status(201).json({ message: "✅ Event request saved successfully!" });
  } catch (err) {
    console.error("❌ Error inserting event request:", err);
    res.status(500).json({ message: "Database error." });
  }
});