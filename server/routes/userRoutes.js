const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getUserProfile,
  searchUsers,
  toggleFollowUser,
  updateUserProfile,
  changeUserPassword,
  updateUserPrivacySettings,
  getUserSessions,
  confirmUserSession,
  logoutUserSession,
  getUserEmails,
} = require('../controllers/userController');

// Routes
router.route('/search').get(protect, searchUsers);

// Settings and Profile Routes (Must be before wildcard :identifier)
router.route('/profile/update').put(protect, updateUserProfile);
router.route('/profile/change-password').put(protect, changeUserPassword);
router.route('/profile/privacy-settings').put(protect, updateUserPrivacySettings);

// Sessions / Login Activity Routes
router.route('/profile/sessions').get(protect, getUserSessions);
router.route('/profile/sessions/:id/confirm').put(protect, confirmUserSession);
router.route('/profile/sessions/:id').delete(protect, logoutUserSession);

// Email Logs Routes
router.route('/profile/emails').get(protect, getUserEmails);

// Wildcard route matches at the end
router.route('/:identifier').get(protect, getUserProfile);
router.route('/:id/follow').put(protect, toggleFollowUser);

module.exports = router;
