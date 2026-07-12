const Notification = require('../models/Notification');

// @desc    Get all notifications for user
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('sender', 'username profilePic fullName')
      .populate('relatedPost', 'videoUrl')
      .sort({ createdAt: -1 });

    const FollowRequest = require('../models/FollowRequest');
    const pendingFollowRequestsCount = await FollowRequest.countDocuments({ recipient: req.user._id, status: 'pending' });

    res.status(200).json({ 
      success: true, 
      pendingFollowRequestsCount,
      data: notifications 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get combined recent activity (notifications + unfollows) for the retro profile
// @route   GET /api/notifications/recent-activity
// @access  Private
const getRecentActivity = async (req, res) => {
  try {
    const UnfollowRecord = require('../models/UnfollowRecord');
    
    // Fetch recent notifications
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('sender', 'username profilePic fullName')
      .populate('relatedPost', 'videoUrl')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    // Fetch recent unfollows
    const unfollows = await UnfollowRecord.find({ userId: req.user._id })
      .populate('unfollowerId', 'username profilePic fullName')
      .sort({ unfollowedAt: -1 })
      .limit(20)
      .lean();

    // Normalize and combine
    const combinedActivity = [
      ...notifications.map(n => ({
        type: 'notification',
        event: n.type, // 'like_reel', 'comment', 'follow'
        user: n.sender,
        createdAt: n.createdAt,
        relatedPost: n.relatedPost,
        isRead: n.isRead,
        _id: n._id
      })),
      ...unfollows.map(u => ({
        type: 'unfollow',
        event: 'unfollow',
        user: u.unfollowerId,
        createdAt: u.unfollowedAt,
        _id: u._id
      }))
    ];

    // Sort combined by descending timestamp
    combinedActivity.sort((a, b) => b.createdAt - a.createdAt);

    res.status(200).json({ success: true, data: combinedActivity.slice(0, 20) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  getRecentActivity
};
