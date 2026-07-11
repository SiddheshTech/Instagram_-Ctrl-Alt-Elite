const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getUserProfile,
  searchUsers,
  toggleFollowUser,
} = require('../controllers/userController');

// Routes
router.route('/search').get(protect, searchUsers);
router.route('/:identifier').get(protect, getUserProfile);
router.route('/:id/follow').put(protect, toggleFollowUser);

module.exports = router;
