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
  updateUserTimeSettings,
  getUserTimeSpent,
  getUserUnfollowers,
  getFollowRequests,
  approveFollowRequest,
  rejectFollowRequest,
  updateRetroProfile
} = require('../controllers/userController');

// Routes
router.route('/search').get(protect, searchUsers);
router.route('/sessions').get(protect, getUserSessions);
router.route('/sessions/:id/confirm').put(protect, confirmUserSession);
router.route('/sessions/:id').delete(protect, logoutUserSession);
router.route('/emails').get(protect, getUserEmails);
router.route('/unfollowers').get(protect, getUserUnfollowers);
router.route('/follow-requests').get(protect, getFollowRequests);
router.route('/follow-requests/:id/approve').put(protect, approveFollowRequest);
router.route('/follow-requests/:id/reject').put(protect, rejectFollowRequest);

router.route('/retro-profile').put(protect, updateRetroProfile);

router.route('/time-settings').put(protect, updateUserTimeSettings);
router.route('/time-spent').get(protect, getUserTimeSpent);

router.route('/profile').put(protect, updateUserProfile);
router.route('/password').put(protect, changeUserPassword);
router.route('/privacy').put(protect, updateUserPrivacySettings);

router.route('/:identifier').get(protect, getUserProfile);
router.route('/:id/follow').put(protect, toggleFollowUser);

module.exports = router;
