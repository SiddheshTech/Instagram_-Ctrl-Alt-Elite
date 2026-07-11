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

const updateUserProfile = async (req, res) => {
  try {
    const { fullName, username, website, bio, profilePic } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // If username changes, make sure it is not taken
    if (username && username.toLowerCase() !== user.username) {
      const usernameExists = await User.findOne({ username: username.toLowerCase() });
      if (usernameExists) {
        return res.status(400).json({ success: false, message: 'Username is already taken' });
      }
      user.username = username.toLowerCase();
    }

    if (fullName) user.fullName = fullName;
    if (website !== undefined) user.website = website;
    if (bio !== undefined) user.bio = bio;
    if (profilePic !== undefined) user.profilePic = profilePic;

    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        _id: updatedUser._id,
        username: updatedUser.username,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        profilePic: updatedUser.profilePic,
        bio: updatedUser.bio,
        website: updatedUser.website,
        isPrivate: updatedUser.isPrivate,
        accountType: updatedUser.accountType,
        showActivityStatus: updatedUser.showActivityStatus,
        allowStorySharing: updatedUser.allowStorySharing,
        followers: updatedUser.followers,
        following: updatedUser.following,
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const changeUserPassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmNewPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ success: false, message: 'New passwords do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    // Get user with password included
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Match old password
    const isMatch = await user.matchPassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect old password' });
    }

    // Update password (pre-save hook will hash it)
    user.password = newPassword;
    await user.save();

    // Log security email
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const Session = require('../models/Session');
    const session = await Session.findById(req.sessionId);
    const device = session ? session.device : 'Unknown Device';
    const location = session ? session.location : 'Unknown Location';

    const EmailLog = require('../models/EmailLog');
    await EmailLog.create({
      userId: user._id,
      subject: 'Your Instagram password was changed',
      body: `This is a confirmation that your account password was changed recently from ${device} in ${location} (IP: ${ip}) at ${new Date().toLocaleString()}. If you made this change, you can ignore this. If not, please reset your password immediately.`,
      category: 'security'
    });

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const updateUserPrivacySettings = async (req, res) => {
  try {
    const { isPrivate, accountType, showActivityStatus, allowStorySharing } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (isPrivate !== undefined) user.isPrivate = isPrivate;
    if (accountType !== undefined) user.accountType = accountType;
    if (showActivityStatus !== undefined) user.showActivityStatus = showActivityStatus;
    if (allowStorySharing !== undefined) user.allowStorySharing = allowStorySharing;

    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      message: 'Privacy settings updated successfully',
      data: {
        isPrivate: updatedUser.isPrivate,
        accountType: updatedUser.accountType,
        showActivityStatus: updatedUser.showActivityStatus,
        allowStorySharing: updatedUser.allowStorySharing
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getUserSessions = async (req, res) => {
  try {
    const Session = require('../models/Session');
    const sessions = await Session.find({
      userId: req.user._id,
    }).sort({ lastActive: -1 });

    res.status(200).json({ success: true, data: sessions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const confirmUserSession = async (req, res) => {
  try {
    const { wasConfirmed } = req.body;
    const Session = require('../models/Session');
    const session = await Session.findOne({ _id: req.params.id, userId: req.user._id });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    session.wasConfirmed = wasConfirmed;
    
    if (wasConfirmed === false) {
      session.isActive = false;
    }
    
    await session.save();

    if (wasConfirmed === false) {
      const io = req.app.get('io');
      io.emit('sessionTerminated', { userId: req.user._id, token: session.token, sessionId: session._id });
    }

    res.status(200).json({ 
      success: true, 
      message: wasConfirmed ? 'Session confirmed successfully' : 'Session rejected and logged out',
      data: session
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const logoutUserSession = async (req, res) => {
  try {
    const Session = require('../models/Session');
    const session = await Session.findOne({ _id: req.params.id, userId: req.user._id });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    session.isActive = false;
    await session.save();

    const io = req.app.get('io');
    io.emit('sessionTerminated', { userId: req.user._id, token: session.token, sessionId: session._id });

    res.status(200).json({ success: true, message: 'Logged out session successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getUserEmails = async (req, res) => {
  try {
    const EmailLog = require('../models/EmailLog');
    
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const emails = await EmailLog.find({
      userId: req.user._id,
      sentAt: { $gte: fourteenDaysAgo }
    }).sort({ sentAt: -1 });

    const otherEmails = emails.filter(email => email.category === 'other');
    if (otherEmails.length === 0) {
      const seedEmails = [
        {
          userId: req.user._id,
          subject: "See what you missed on Instagram",
          body: "Hi! You have 5 unread messages and 3 new followers. Open the app to see who they are!",
          category: "other",
          sentAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
        },
        {
          userId: req.user._id,
          subject: "Check out kevin's latest post",
          body: "Your friend Kevin just posted a new photo! Check it out and write a comment.",
          category: "other",
          sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        }
      ];
      const createdSeed = await EmailLog.insertMany(seedEmails);
      emails.push(...createdSeed);
      emails.sort((a, b) => b.sentAt - a.sentAt);
    }

    res.status(200).json({ success: true, data: emails });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  getUserProfile,
  searchUsers,
  toggleFollowUser,
  updateUserProfile,
  changeUserPassword,
  updateUserPrivacySettings,
  getUserSessions,
  confirmUserSession,
  logoutUserSession,
  getUserEmails
};
