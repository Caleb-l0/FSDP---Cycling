
require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const sql = require("mssql");
const db = require("./dbconfig");

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


// !!!!!!!!!!!!!1!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

// ------- Community Controller ---------

const CommunityController = require("./Controllers/Volunteer_Community_Controller.js")
// ------- Email Controller ---------------
const EmailController = require("./Controllers/GetEmail_Controller")

// ------ Event Controller for all event related -------
const EventController = require("./Controllers/EventController");
// ----- REQUEST CONTROLLER -----
const requestController = require('./Controllers/GetRequestController');

// ----- ADMIN EVENT CONTROLLER -----
const adminEventController = require('./Controllers/Admin_event_Controller');

// ----- VOLUNTEER EVENT CONTROLLER -----
const eventController = require('./Controllers/VolunteerEventController.js');

// ----- LOGIN MODEL (for text size updates) -----
const loginModel = require('./Accounts/login/loginModel');

// --------------- translation




// !!!!!!!!!!!!!1!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

const fetch = require("node-fetch");










//  ???????????????????????????????????????????????????????

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
app.get("/profile", authenticate, async (req, res) => {
  res.json({
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    textSizePreference: req.user.textSizePreference || 'normal'
  });
});

// ----- UPDATE PROFILE -----
app.put("/profile", authenticate, async (req, res) => {
  const { name, email, textSizePreference } = req.body;

  try {
    await loginModel.updateUser(req.user.id, name, email, textSizePreference);

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
app.get("/events/by-location",authenticate, EventController.getEventsByLocation);
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







app.get('/admin/events', authenticate, adminEventController.getAllEvents); 
app.get("/admin/events/location/:eventID",authenticate,adminEventController.getEventLocation);
app.post('/admin/create_events', authenticate, adminEventController.createEvent);
app.put('/admin/assign_events',authenticate,adminEventController.assignEventToOrgan)

// ----- VOLUNTEER EVENT FEED -----

app.get('/volunteer/events', adminEventController.getAllEvents);
app.get('/volunteer/signed-events', authenticate, eventController.getSignedUpEvents);
app.post('/events/signup', authenticate, eventController.signUp);
app.get("/institution/events/all", adminEventController.getAllEvents);




// ----- Community route ----------

app.get("/community/browse/posts",authenticate, CommunityController.browsePosts);
app.post("/community/posts", authenticate,  CommunityController.createPost);

app.get("/community/browse/volunteers",authenticate,  CommunityController.browseVolunteers);
app.get("/community/browse/institutions", authenticate, CommunityController.getInstitutions);
app.post("/community/posts/:postId/like", authenticate, CommunityController.toggleLike);

app.post("/community/posts/:postId/comments", authenticate, CommunityController.createComment);

app.get("/community/posts/:postId/comments", authenticate, CommunityController.getComments);


//  ???????????????????????????????????????????????????????


// ----- REWARDS SYSTEM -----

const rewardsController = require("./Controllers/reward_controller.js");
app.get("/rewards/:userId", authenticate, rewardsController.getRewards);
app.post("/redeem", authenticate, rewardsController.redeemItem);
app.get("/history/:userId", authenticate, rewardsController.getHistory);



const { requestEvent } = require("./Controllers/is.js");

app.post("/request-event", authenticate, requestEvent);

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




app.post("/translate", async (req, res) => {
  try {
    const response = await fetch("https://fsdp-cycling-ltey.onrender.com/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Translate error:", err);
    res.status(500).json({ error: "Translation failed" });
  }
});




// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
});

// ----- START SERVER -----
app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
});
