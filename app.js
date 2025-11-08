require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/Accounts/views/login.html");
});
app.use(express.static(__dirname + '/Accounts/views')); // serve HTML/JS


// login imports
const { loginUser, getUserById, updateUser, deleteUser } = require('./Accounts/login/loginController');
const { validateLogin } = require('./Accounts/login/loginValidation');
const { authenticate } = require('./Accounts/login/authenticate');


// Signup imports
const { signupUser } = require('./Accounts/signup/signupController');
const { validateSignup } = require('./Accounts/signup/signupValidation');

// Routes

// LOGIN
app.post('/login', validateLogin, loginUser);
app.get('/user/:id', authenticate, getUserById);
app.put('/user/:id', authenticate, updateUser);
app.delete('/user/:id', authenticate, deleteUser);

// SIGNUP
app.post('/signup', validateSignup, signupUser);

// Serve HTML pages
app.get('/login', (req, res) => res.sendFile(__dirname + '/Accounts/views/login.html'));
app.get('/signup', (req, res) => res.sendFile(__dirname + '/Accounts/views/signup.html'));

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});



