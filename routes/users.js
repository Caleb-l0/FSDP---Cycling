const express = require('express');
const router = express.Router();
const usersController = require('../Accounts/controllers/usersController');

// POST /api/users/signup
router.post('/signup', usersController.signup);

// POST /api/users/login
router.post('/login', usersController.login);

module.exports = router;
