const express = require('express');
const router = express.Router();
const { sendOTP, verifyOTP, register, login } = require('../controllers/authController');

// Send OTP email route
router.post('/send-otp', sendOTP);

// Verify OTP route
router.post('/verify-otp', verifyOTP);

// Traditional register and login routes
router.post('/register', register);
router.post('/login', login);

module.exports = router;
