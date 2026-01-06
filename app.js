

require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const sql = require("mssql");
const db = require("./dbconfig");
const jwt = require("jsonwebtoken");
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

// Event Booking Routies (By Organzations)
const eventBookingRoutes = require("./Routes/EventBookingRoutes");
app.use("/organization/events", eventBookingRoutes);


// -------Email -------------
app.get("/getOrganID",authenticate,EmailController.getOrganisationID)
app.get("/getUserEmail/:orgID",authenticate,EmailController.getMemberEmailsByOrganizationID)
app.get("/send-email",authenticate,EmailController.getMemberEmailsByOrganizationID)



// ------ Event API Routes (must be before static files) -------------

app.get("/events/checkAssigned/:eventID", authenticate, EventController.checkAssigned);
app.delete("/events/cancel/:eventID", authenticate, EventController.cancel);
app.get("/events/by-location",authenticate, EventController.getEventsByLocation);
app.get("/events/:eventID", authenticate, EventController.getEventById);
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




// ----- ADMIN EVENT FEED -----
app.get('/admin/events', authenticate, adminEventController.getAllEvents); 
app.get("/admin/events/location/:eventID",authenticate,adminEventController.getEventLocation);
app.post('/admin/create_events', authenticate, adminEventController.createEvent);
app.put('/admin/assign_events',authenticate,adminEventController.assignEventToOrgan)


// ----- VOLUNTEER EVENT FEED -----

app.get('/volunteer/events', adminEventController.getAllEvents);
app.get('/volunteer/signed-events', authenticate, eventController.getSignedUpEvents);
app.post('/events/signup', authenticate, eventController.signUp);
app.get("/institution/events/all", adminEventController.getAllEvents);
app.get("/volunteer/events/:id", authenticate, eventController.getEventDetails);
app.post("/volunteer/events/signup/:eventID", authenticate, EventController.signup);
app.delete("/volunteer/events/delete/:eventID", authenticate, EventController.deleteEvent);
app.get("/volunteer/event/isSignedUp/:eventID", authenticate, EventController.isSignedUp);


// ----- Community route FOR Volunteer----------

app.get("/community/browse/posts",authenticate, CommunityController.browsePosts);
app.post("/community/posts", authenticate,  CommunityController.createPost);

app.get("/community/browse/volunteers",authenticate,  CommunityController.browseVolunteers);
app.get("/community/browse/institutions", authenticate, CommunityController.getInstitutions);
app.post("/community/posts/:postId/like", authenticate, CommunityController.toggleLike);

app.post("/community/posts/:postId/comments", authenticate, CommunityController.createComment);

app.get("/community/posts/:postId/comments", authenticate, CommunityController.getComments);


//  ???????????????????????????????????????????????????????


// REWARDS SYSTEM For Volunteer -----

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


// ----- TRANSLATION ROUTE -----
app.post("/translate", async (req, res) => {
  let { q, from = "auto", to } = req.body;

  if (!q || !to) {
    return res.json({
      translatedText: Array.isArray(q) ? q : (q || ""),
      translatedTexts: Array.isArray(q) ? q.map(() => "") : undefined
    });
  }

  const isBatch = Array.isArray(q);
  const texts = isBatch ? q : [q];

  //
  const userEmail = "chensail@outlook.com";  

  const translatedResults = [];

  try {
    for (const text of texts) {
      const encodedText = encodeURIComponent(text.trim());
      let url = `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=${from}|${to}`;

      // 
      if (userEmail && userEmail.includes("@")) {
        url += `&de=${encodeURIComponent(userEmail)}`;
      }

      const r = await fetch(url, { signal: AbortSignal.timeout(15000) });

      if (!r.ok) {
        translatedResults.push(text);
        continue;
      }

      const data = await r.json();

      if (data.responseStatus === 200) {
        translatedResults.push(data.responseData.translatedText || text);
      } else {
        translatedResults.push(text);
      }
    }

    if (isBatch) {
      res.json({ translatedTexts: translatedResults });
    } else {
      res.json({ translatedText: translatedResults[0] });
    }

  } catch (err) {
    console.error("MyMemory translate error:", err);

    if (isBatch) {
      res.json({ translatedTexts: texts });
    } else {
      res.json({ translatedText: q });
    }
  }
});


// ----- GOOGLE LOGIN ROUTE -----


const pool = require("./db");
const { OAuth2Client } = require("google-auth-library");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


app.post("/auth/google", async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ message: "Missing credential" });
    }

    
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const email = payload.email;
    const name = payload.name || "Google User";

    
   let result = await pool.query(
  "SELECT id, name, email, role, textsizepreference FROM users WHERE email = $1",  
  [email]
);

    let user = result.rows[0];

    if (!user) {
     
      const insert = await pool.query(
        `INSERT INTO users (name, email, role, textSizePreference) 
         VALUES ($1, $2, 'volunteer', 'normal') 
         RETURNING id, name, email, role, textSizePreference`,
        [name, email]
      );
      user = insert.rows[0];
    }

   
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      textSizePreference: user.textSizePreference || 'normal'
    });

  } catch (err) {
    console.error("❌ Google login error:", err);
    res.status(500).json({ 
      message: "Google login failed",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  }
});
// te'st database connection


app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ success: true, time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
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

// ---------------- Camera access script for Volunteer page ----------------
app.get('/camera', authenticate, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/camera.html'));
});
