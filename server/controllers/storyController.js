const Story = require('../models/Story');
const User = require('../models/User');

// @desc    Create a new story
// @route   POST /api/stories
// @access  Private
const createStory = async (req, res) => {
  try {
    const { mediaUrl } = req.body;

    if (!mediaUrl) {
      return res.status(400).json({ success: false, message: 'Media URL is required' });
    }

    // Story expires in 24 hours
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const story = await Story.create({
      user: req.user._id,
      mediaUrl,
      expiresAt,
      viewers: []
    });

    await story.populate('user', 'username profilePic fullName');

    res.status(201).json({ success: true, data: story });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get all active stories (from followed users + self)
// @route   GET /api/stories
// @access  Private
const getStories = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    
    // Determine whose stories to fetch (users we follow + our own)
    // If the user doesn't follow anyone, fetch all stories (Discovery mode)
    let usersToFetch = [req.user._id];
    
    if (currentUser.following && currentUser.following.length > 0) {
      usersToFetch = [...usersToFetch, ...currentUser.following];
    } else {
      // Discovery mode: fetch all users who have active stories
      const allUsers = await User.find({}, '_id');
      usersToFetch = allUsers.map(u => u._id);
    }

    // Only fetch stories that haven't expired
    const activeStories = await Story.find({
      user: { $in: usersToFetch },
      expiresAt: { $gt: new Date() }
    })
      .populate('user', 'username profilePic fullName')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: activeStories });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  createStory,
  getStories
};
