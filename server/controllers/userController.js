const User = require('../models/User');

// @desc    Get user profile by ID or username
// @route   GET /api/users/:identifier
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const { identifier } = req.params;
    let user;

    // Check if identifier is a valid ObjectId
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      user = await User.findById(identifier).select('-password');
    } else {
      user = await User.findOne({ username: identifier }).select('-password');
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Search for users
// @route   GET /api/users/search?q=query
// @access  Private
const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }

    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { fullName: { $regex: q, $options: 'i' } }
      ]
    }).select('username fullName profilePic').limit(20);

    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Toggle Follow / Unfollow User
// @route   PUT /api/users/:id/follow
// @access  Private
const toggleFollowUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot follow yourself' });
    }

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser || !currentUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isFollowing = currentUser.following.includes(targetUserId);

    if (isFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter(
        (id) => id.toString() !== targetUserId.toString()
      );
      targetUser.followers = targetUser.followers.filter(
        (id) => id.toString() !== currentUserId.toString()
      );
    } else {
      // Follow
      currentUser.following.push(targetUserId);
      targetUser.followers.push(currentUserId);
      
      const Notification = require('../models/Notification');
      await Notification.create({
        recipient: targetUserId,
        sender: currentUserId,
        type: 'follow'
      });
      
      const io = req.app.get('io');
      const onlineUsers = req.app.get('onlineUsers');
      const receiverSocket = onlineUsers.get(targetUserId.toString());
      if (receiverSocket) {
        io.to(receiverSocket).emit('newNotification');
      }
    }

    await currentUser.save();
    await targetUser.save();

    res.status(200).json({ 
      success: true, 
      message: isFollowing ? 'Unfollowed successfully' : 'Followed successfully',
      isFollowing: !isFollowing
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  getUserProfile,
  searchUsers,
  toggleFollowUser
};
