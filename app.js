require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;



const cors = require('cors');




app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(__dirname)); // index.html, index.css, images, etc.
app.use('/Accounts/views', express.static(path.join(__dirname, 'Accounts/views'))); // login.html, signup.html

// ----- LOGIN ROUTES -----
const { loginUser, getUserById, updateUser, deleteUser } = require('./Accounts/login/loginController');
const { validateLogin } = require('./Accounts/login/loginValidation');
const { authenticate } = require('./Accounts/login/authenticate');


// ----- REQUEST CONTROLLER -----
const requestController = require('./Controllers/GetRequestController');


// ----- ADMIN EVENT CONTROLLER -----
const adminEventController = require('./Controllers/Admin_event_Controller');

// Login route


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




// ------ REQUEST ROUTES -----
app.get('/admin/applications', authenticate,requestController.getAllRequests);
app.get('/requests/organization/:organizationId', requestController.getRequestByOragnization);
app.get('/requests/history/:date', requestController.getRequestByHistory);




// ----- ADMIN EVENT ROUTES -----
app.get('/admin/events', authenticate, adminEventController.getAllEvents);


// Start server
app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
});
