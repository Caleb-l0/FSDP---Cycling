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

// ----- LOGIN & SIGNUP API ROUTES (must be before static files) -----
app.post('/login', validateLogin, loginUser);

// ----- SIGNUP ROUTES -----
const { signupUser } = require('./Accounts/signup/signupController');
const { validateSignup } = require('./Accounts/signup/signupValidation');

app.post('/signup', validateSignup, signupUser);

// ----- USER API ROUTES -----
app.get('/user/:id', authenticate, getUserById);
app.put('/user/:id', authenticate, updateUser);
app.delete('/user/:id', authenticate, deleteUser);

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

// -------Email -------------
app.get("/getOrganID",authenticate,EmailController.getOrganisationID)
app.get("/getUserEmail/:orgID",authenticate,EmailController.getMemberEmailsByOrganizationID)
app.get("/send-email",authenticate,EmailController.getMemberEmailsByOrganizationID)

// ------ Event API Routes (must be before static files) -------------
app.get("/events/checkAssigned/:eventID", authenticate, EventController.checkAssigned);
app.get("/isSignedUp", authenticate, EventController.isSignedUp);
app.post("/events/signup/:eventID", authenticate, EventController.signup);
app.delete("/events/cancel/:eventID", authenticate, EventController.cancel);
app.get("/events/:eventID", authenticate, EventController.getEventById);
app.delete("/events/delete/:eventID", authenticate, EventController.deleteEvent);
app.put("/events/update/:eventID", authenticate, EventController.updateEvent);

// Serve static files (for CSS, JS, images, etc.) - but after API routes
app.use('/public', express.static(path.join(__dirname, 'public'))); // header, images, etc.
app.use('/Accounts/views', express.static(path.join(__dirname, 'Accounts/views'))); // login.html, signup.html

// ----- HTML PAGES -----
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'Accounts/views/login.html')));
app.get('/signup', (req, res) => res.sendFile(path.join(__dirname, 'Accounts/views/signup.html')));

// Serve root static files LAST (index.css, etc.) - after all routes
app.use(express.static(__dirname)); // index.html, index.css, root images, etc.

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

// 404 handler for API routes - must be after static files
app.use((req, res, next) => {
  // If it's an API route that wasn't matched, return JSON
  const isApiRoute = req.path.startsWith('/admin/') || 
                     req.path.startsWith('/volunteer/') || 
                     req.path.startsWith('/api/') ||
                     req.path.startsWith('/events/') ||
                     req.path.startsWith('/organization/') ||
                     req.path.startsWith('/requests/') ||
                     req.path.startsWith('/request/') ||
                     req.path.startsWith('/user/') ||
                     req.path.startsWith('/getOrganID') ||
                     req.path.startsWith('/getUserEmail/') ||
                     req.path.startsWith('/send-email') ||
                     req.path.startsWith('/isSignedUp') ||
                     (req.path.startsWith('/login') && req.method === 'POST') ||
                     (req.path.startsWith('/signup') && req.method === 'POST');
  
  if (isApiRoute) {
    return res.status(404).json({ message: 'API endpoint not found' });
  }
  next();
});

// Global error handler - must be last
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  // If it's an API route, return JSON error
  const isApiRoute = req.path.startsWith('/admin/') || 
                     req.path.startsWith('/volunteer/') || 
                     req.path.startsWith('/api/') ||
                     req.path.startsWith('/events/') ||
                     req.path.startsWith('/login') ||
                     req.path.startsWith('/signup') ||
                     req.path.startsWith('/user/') ||
                     req.path.startsWith('/organization/') ||
                     req.path.startsWith('/requests/') ||
                     req.path.startsWith('/request/') ||
                     req.path.startsWith('/getOrganID') ||
                     req.path.startsWith('/getUserEmail/') ||
                     req.path.startsWith('/send-email') ||
                     req.path.startsWith('/isSignedUp');
  
  if (isApiRoute) {
    return res.status(err.status || 500).json({
      message: err.message || 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
  
  // For non-API routes, you might want to render an error page
  res.status(err.status || 500).send('Internal Server Error');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
});

// ----- START SERVER -----
app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
});
