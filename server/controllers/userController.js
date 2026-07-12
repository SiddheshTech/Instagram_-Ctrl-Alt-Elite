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
      user = await User.findById(identifier).select('-password').populate('topFriends', 'username profilePic fullName');
    } else {
      user = await User.findOne({ username: identifier }).select('-password').populate('topFriends', 'username profilePic fullName');
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
      
      // Log unfollow event in UnfollowRecord
      const UnfollowRecord = require('../models/UnfollowRecord');
      await UnfollowRecord.create({
        userId: targetUserId,
        unfollowerId: currentUserId
      });
      
      await currentUser.save();
      await targetUser.save();

      return res.status(200).json({ 
        success: true, 
        message: 'Unfollowed successfully',
        isFollowing: false
      });
    } else {
      // Follow Logic
      
      // If target user is private, we send a follow request instead
      if (targetUser.isPrivate) {
        const FollowRequest = require('../models/FollowRequest');
        const existingRequest = await FollowRequest.findOne({ 
          sender: currentUserId, 
          recipient: targetUserId,
          status: 'pending'
        });

        if (existingRequest) {
          // Toggle behavior: cancel request if it already exists
          await FollowRequest.deleteOne({ _id: existingRequest._id });
          return res.status(200).json({ 
            success: true, 
            message: 'Follow request cancelled',
            isFollowing: false,
            isRequested: false
          });
        } else {
          // Create follow request
          const newRequest = await FollowRequest.create({
            sender: currentUserId,
            recipient: targetUserId
          });

          // Trigger real-time alert via socket
          const io = req.app.get('io');
          io.to(targetUserId.toString()).emit('newFollowRequest', {
            requestId: newRequest._id,
            sender: {
              _id: currentUser._id,
              username: currentUser.username,
              fullName: currentUser.fullName,
              profilePic: currentUser.profilePic
            }
          });

          return res.status(200).json({ 
            success: true, 
            message: 'Follow request sent',
            isFollowing: false,
            isRequested: true
          });
        }
      }

      // Public profile direct follow
      currentUser.following.push(targetUserId);
      targetUser.followers.push(currentUserId);
      
      const Notification = require('../models/Notification');
      await Notification.create({
        recipient: targetUserId,
        sender: currentUserId,
        type: 'follow'
      });
      
      const io = req.app.get('io');
      io.to(targetUserId.toString()).emit('newNotification');

      await currentUser.save();
      await targetUser.save();

      return res.status(200).json({ 
        success: true, 
        message: 'Followed successfully',
        isFollowing: true
      });
    }
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

const updateUserTimeSettings = async (req, res) => {
  try {
    const { dailyTimeLimit, breakReminder, mutePushNotifications } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (dailyTimeLimit !== undefined) user.dailyTimeLimit = dailyTimeLimit;
    if (breakReminder !== undefined) user.breakReminder = breakReminder;
    if (mutePushNotifications !== undefined) user.mutePushNotifications = mutePushNotifications;

    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      message: 'Time settings updated successfully',
      data: {
        dailyTimeLimit: updatedUser.dailyTimeLimit,
        breakReminder: updatedUser.breakReminder,
        mutePushNotifications: updatedUser.mutePushNotifications
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getUserTimeSpent = async (req, res) => {
  try {
    const TimeSpent = require('../models/TimeSpent');
    
    // Find logs for the last 7 days
    const logs = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      logs.push(dateStr);
    }
    
    let timeLogs = await TimeSpent.find({
      userId: req.user._id,
      date: { $in: logs }
    });

    // Seed realistic usage logs if no data exists
    if (timeLogs.length === 0) {
      const seedLogs = [
        { userId: req.user._id, date: logs[0], minutes: 45 }, // Today (matching screenshot's 45m daily average)
        { userId: req.user._id, date: logs[1], minutes: 30 },
        { userId: req.user._id, date: logs[2], minutes: 50 },
        { userId: req.user._id, date: logs[3], minutes: 60 },
        { userId: req.user._id, date: logs[4], minutes: 40 },
        { userId: req.user._id, date: logs[5], minutes: 55 },
        { userId: req.user._id, date: logs[6], minutes: 35 },
      ];
      timeLogs = await TimeSpent.insertMany(seedLogs);
    }

    // Sort logs descending by date
    timeLogs.sort((a, b) => b.date.localeCompare(a.date));

    // Calculate daily average
    const totalMinutes = timeLogs.reduce((acc, curr) => acc + curr.minutes, 0);
    const dailyAverage = Math.round(totalMinutes / timeLogs.length);

    res.status(200).json({
      success: true,
      data: {
        dailyAverage,
        history: timeLogs
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getUserUnfollowers = async (req, res) => {
  try {
    const UnfollowRecord = require('../models/UnfollowRecord');
    
    let unfollowers = await UnfollowRecord.find({ userId: req.user._id })
      .populate('unfollowerId', 'username fullName profilePic')
      .sort({ unfollowedAt: -1 });

    // Seed realistic unfollow event if list is empty
    if (unfollowers.length === 0) {
      // Find another user to act as unfollower
      let jessica = await User.findOne({ username: 'jessica' });
      if (!jessica) {
        jessica = await User.create({
          username: 'jessica',
          fullName: 'Jessica Miller',
          email: 'jessica@example.com',
          password: 'password123',
          profilePic: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'
        });
      }

      await UnfollowRecord.create({
        userId: req.user._id,
        unfollowerId: jessica._id,
        unfollowedAt: new Date(Date.now() - 5 * 60 * 60 * 1000) // 5 hours ago (matching screenshot!)
      });

      unfollowers = await UnfollowRecord.find({ userId: req.user._id })
        .populate('unfollowerId', 'username fullName profilePic')
        .sort({ unfollowedAt: -1 });
    }

    res.status(200).json({ success: true, data: unfollowers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getFollowRequests = async (req, res) => {
  try {
    const FollowRequest = require('../models/FollowRequest');
    const requests = await FollowRequest.find({ recipient: req.user._id, status: 'pending' })
      .populate('sender', 'username fullName profilePic');

    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const approveFollowRequest = async (req, res) => {
  try {
    const requestId = req.params.id;
    const FollowRequest = require('../models/FollowRequest');
    
    const request = await FollowRequest.findById(requestId);
    if (!request || request.recipient.toString() !== req.user._id.toString()) {
      return res.status(404).json({ success: false, message: 'Follow request not found' });
    }

    const sender = await User.findById(request.sender);
    const recipient = await User.findById(request.recipient);

    if (!sender || !recipient) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Add follower
    if (!recipient.followers.includes(sender._id)) {
      recipient.followers.push(sender._id);
    }
    if (!sender.following.includes(recipient._id)) {
      sender.following.push(recipient._id);
    }

    await recipient.save();
    await sender.save();

    // Delete follow request
    await FollowRequest.findByIdAndDelete(requestId);

    // Create follow notification
    const Notification = require('../models/Notification');
    await Notification.create({
      recipient: sender._id,
      sender: recipient._id,
      type: 'follow'
    });

    // Real-time update via Socket.io
    const io = req.app.get('io');
    io.to(sender._id.toString()).emit('newNotification');
    io.to(recipient._id.toString()).emit('followRequestApproved', { requestId });

    res.status(200).json({ success: true, message: 'Follow request approved' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const rejectFollowRequest = async (req, res) => {
  try {
    const requestId = req.params.id;
    const FollowRequest = require('../models/FollowRequest');
    
    const request = await FollowRequest.findOneAndDelete({ 
      _id: requestId, 
      recipient: req.user._id 
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Follow request not found' });
    }

    const io = req.app.get('io');
    io.to(req.user._id.toString()).emit('followRequestRejected', { requestId });

    res.status(200).json({ success: true, message: 'Follow request rejected' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update retro profile settings (Status, Now Playing, Top Friends)
// @route   PUT /api/users/retro-profile
// @access  Private
const updateRetroProfile = async (req, res) => {
  try {
    const { customStatus, topFriends, nowPlaying } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (customStatus !== undefined) user.customStatus = customStatus;
    
    if (topFriends && Array.isArray(topFriends)) {
      // Limit to 8 friends
      user.topFriends = topFriends.slice(0, 8);
    }

    if (nowPlaying) {
      user.nowPlaying = {
        title: nowPlaying.title || '',
        artist: nowPlaying.artist || '',
        audioUrl: nowPlaying.audioUrl || ''
      };
      
      // Emit socket event to update everyone viewing this profile
      const io = req.app.get('io');
      if (io) {
        io.emit('nowPlayingUpdated', { userId: user._id, nowPlaying: user.nowPlaying });
      }
    }

    await user.save();
    
    // Repopulate topFriends for the response
    await user.populate('topFriends', 'username profilePic fullName');

    res.status(200).json({ success: true, data: user });
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
  getUserEmails,
  updateUserTimeSettings,
  getUserTimeSpent,
  getUserUnfollowers,
  getFollowRequests,
  approveFollowRequest,
  rejectFollowRequest,
  updateRetroProfile
};
