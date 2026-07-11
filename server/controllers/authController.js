const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');
const EmailLog = require('../models/EmailLog');
const { getIPLocation, parseUserAgent } = require('../utils/geo');

// Helper to generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/signup
 * @access  Public
 */
const signupUser = async (req, res) => {
  try {
    const { username, fullName, email, password } = req.body;

    // Check for missing fields
    if (!username || !fullName || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: 'Please enter all required fields' });
    }

    // Check if email already exists
    const emailExists = await User.findOne({ email: email.toLowerCase() });
    if (emailExists) {
      return res
        .status(400)
        .json({ success: false, message: 'Email is already registered' });
    }

    // Check if username already exists
    const usernameExists = await User.findOne({ username: username.toLowerCase() });
    if (usernameExists) {
      return res
        .status(400)
        .json({ success: false, message: 'Username is already taken' });
    }

    // Create user (password will be hashed in User pre-save hook)
    const user = await User.create({
      username,
      fullName,
      email,
      password,
    });

    if (user) {
      const token = generateToken(user._id);
      
      // Determine request details for session logging
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];
      
      const location = await getIPLocation(ip);
      const device = parseUserAgent(userAgent);
      
      // Create session
      await Session.create({
        userId: user._id,
        token,
        device,
        location,
        ipAddress: ip || ''
      });

      // Log welcome email in EmailLog
      await EmailLog.create({
        userId: user._id,
        subject: 'Welcome to Instagram!',
        body: `Hi ${user.fullName}, thank you for registering an account on our platform! We are excited to have you here. Your login activity will be tracked from ${device} at ${location} for security.`,
        category: 'security'
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token,
        user: {
          _id: user._id,
          username: user.username,
          fullName: user.fullName,
          email: user.email,
          profilePic: user.profilePic,
          bio: user.bio,
          followers: user.followers,
          following: user.following,
        },
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

/**
 * @desc    Authenticate a user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      return res
        .status(400)
        .json({ success: false, message: 'Please enter all fields' });
    }

    // Find user by either email or username
    const user = await User.findOne({
      $or: [
        { email: emailOrUsername.toLowerCase() },
        { username: emailOrUsername.toLowerCase() },
      ],
    });

    if (user && (await user.matchPassword(password))) {
      const token = generateToken(user._id);

      // Determine request details for session logging
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];
      
      const location = await getIPLocation(ip);
      const device = parseUserAgent(userAgent);
      
      // Create session
      await Session.create({
        userId: user._id,
        token,
        device,
        location,
        ipAddress: ip || ''
      });

      // Log login email in EmailLog
      await EmailLog.create({
        userId: user._id,
        subject: 'New login to Instagram',
        body: `We detected a new login to your account on ${device} in ${location} (IP: ${ip}) at ${new Date().toLocaleString()}. If this was you, no action is required. If this wasn't you, please change your password.`,
        category: 'security'
      });

      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          _id: user._id,
          username: user.username,
          fullName: user.fullName,
          email: user.email,
          profilePic: user.profilePic,
          bio: user.bio,
          followers: user.followers,
          following: user.following,
        },
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email/username or password' });
    }
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  try {
    // req.user is set by the protect middleware
    res.json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    console.error('Get Profile Error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving profile' });
  }
};

module.exports = {
  signupUser,
  loginUser,
  getMe,
};
