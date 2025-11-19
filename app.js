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


// ------- Email Controller
const EmailController = require("./Controllers/GetEmail_Controller")

// ------ Event Controller for all event related -------
const EventController = require("./Controllers/EventController");
// ----- REQUEST CONTROLLER -----
const requestController = require('./Controllers/GetRequestController');

// ----- ADMIN EVENT CONTROLLER -----
const adminEventController = require('./Controllers/Admin_event_Controller');

// ----- VOLUNTEER EVENT CONTROLLER -----
const eventController = require('./public/eventController');

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

// Event Booking Routes (By Organizations)
const eventBookingRoutes = require("./Routes/EventBookingRoutes");
app.use("/organization/events", eventBookingRoutes);

// ------ User--------------

// -------Email -------------

app.get("/getOrganID",authenticate,EmailController.getOrganisationID)
app.get("/getUserEmail/:orgID",authenticate,EmailController.getMemberEmailsByOrganizationID)
app.get("/send-email",authenticate,EmailController.getMemberEmailsByOrganizationID)
// ------ Event -------------

app.get("/:eventID", authenticate, EventController.getEventById);
app.get("/events/checkAssigned/:eventID", authenticate, EventController.checkAssigned);
app.delete("/delete/:eventID", authenticate, EventController.deleteEvent);
app.post("/signup/:eventID", authenticate, EventController.signup);
app.delete("/cancel/:eventID", authenticate, EventController.cancel);
app.get("/isSignedUp", authenticate, EventController.isSignedUp);

app.put("/events/update/:eventID", authenticate, EventController.updateEvent);

// ------ REQUEST ROUTES -----
app.get('/admin/applications', authenticate,requestController.getAllRequests);
app.get('/requests/details/:id', authenticate,requestController.getRequestById);
app.delete('/request/delete/:id',authenticate,requestController.deleteRequest)
app.put('/requests/approve/:id',authenticate,requestController.approveRequest)
app.put('/requests/reject/:id',authenticate,requestController.rejectRequest)
app.get('/requests/status/:id',authenticate,requestController.checkRequestStatus)

// ----- ADMIN EVENT ROUTES -----
app.get('/admin/events', authenticate, adminEventController.getAllEvents);
app.get(
  "/admin/events/location/:eventID",
  authenticate,
  adminEventController.getEventLocation
);
app.post('/admin/create_events', authenticate, adminEventController.createEvent);
app.put('/admin/assign_events',authenticate,adminEventController.assignEventToOrgan)

// ----- VOLUNTEER EVENT FEED -----
app.get('/volunteer/events', adminEventController.getAllEvents);
app.get('/volunteer/signed-events', authenticate, eventController.getSignedUpEvents);

// ----- START SERVER -----
app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
});
