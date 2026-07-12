const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Verify active session exists in DB
      const Session = require('../models/Session');
      const session = await Session.findOne({ userId: decoded.id, token, isActive: true });
      if (!session) {
        return res.status(401).json({ success: false, message: 'Session expired or logged out' });
      }

      // Update session activity time
      session.lastActive = new Date();
      await session.save();

      // Get user from the token (exclude password)
      req.user = await User.findById(decoded.id)
        .select('-password')
        .populate('followers', 'username fullName profilePic')
        .populate('following', 'username fullName profilePic');

      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
      }

      // Attach session info to request if needed
      req.token = token;
      req.sessionId = session._id;

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};

module.exports = { protect };
