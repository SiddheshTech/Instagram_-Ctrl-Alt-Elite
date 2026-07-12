const express = require('express');
const router = express.Router();
const { signupUser, loginUser, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/signup', signupUser);
router.post('/login', loginUser);

// Protected routes
router.get('/me', protect, getMe);

module.exports = router;
