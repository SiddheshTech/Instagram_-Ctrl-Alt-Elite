const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getNotifications,
  markAsRead,
  getRecentActivity
} = require('../controllers/notificationController');

router.route('/').get(protect, getNotifications);
router.route('/recent-activity').get(protect, getRecentActivity);
router.route('/:id/read').put(protect, markAsRead);

module.exports = router;
