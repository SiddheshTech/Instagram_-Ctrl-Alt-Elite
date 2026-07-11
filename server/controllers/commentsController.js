const Comment = require('../models/Comment');
const Reel = require('../models/Reel');

// @desc    Add a comment to a reel
// @route   POST /api/reels/:id/comments
// @access  Private
const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const reelId = req.params.id;

    // Check if reel exists
    const reel = await Reel.findById(reelId);
    if (!reel) {
      return res.status(404).json({ success: false, message: 'Reel not found' });
    }

    if (reel.turnOffCommenting) {
      return res.status(403).json({ success: false, message: 'Commenting is disabled for this post' });
    }

    const comment = await Comment.create({
      user: req.user._id,
      reel: reelId,
      text,
    });

    const populatedComment = await comment.populate('user', 'username profilePic');

    const Notification = require('../models/Notification');
    const User = require('../models/User');
    const io = req.app.get('io');

    // 1. Notify reel owner of comment (if not commenter themselves)
    if (reel.user.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: reel.user,
        sender: req.user._id,
        type: 'comment',
        relatedPost: reel._id
      });
      
      io.to(reel.user.toString()).emit('newNotification');
    }

    // 2. Parse and notify @mentions
    const mentionRegex = /@([a-zA-Z0-9_\.]+)/g;
    let match;
    const uniqueMentions = new Set();
    
    while ((match = mentionRegex.exec(text)) !== null) {
      uniqueMentions.add(match[1].toLowerCase());
    }

    for (let username of uniqueMentions) {
      const mentionedUser = await User.findOne({ username });
      // Don't notify if user mentions themselves or target user was already notified as reel owner
      if (mentionedUser && mentionedUser._id.toString() !== req.user._id.toString()) {
        await Notification.create({
          recipient: mentionedUser._id,
          sender: req.user._id,
          type: 'mention',
          relatedPost: reel._id
        });
        
        io.to(mentionedUser._id.toString()).emit('newNotification');
      }
    }

    res.status(201).json({ success: true, data: populatedComment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get comments for a reel
// @route   GET /api/reels/:id/comments
// @access  Private
const getReelComments = async (req, res) => {
  try {
    const comments = await Comment.find({ reel: req.params.id })
      .populate('user', 'username profilePic')
      .sort({ createdAt: -1 }); // Newest first

    res.status(200).json({ success: true, count: comments.length, data: comments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Toggle like on a comment
// @route   PUT /api/comments/:id/like
// @access  Private
const toggleLikeComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    if (comment.likes.includes(req.user._id)) {
      // Unlike
      comment.likes = comment.likes.filter(
        (like) => like.toString() !== req.user._id.toString()
      );
    } else {
      // Like
      comment.likes.push(req.user._id);
    }

    await comment.save();
    res.status(200).json({ success: true, data: comment.likes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Delete a comment
// @route   DELETE /api/comments/:id
// @access  Private
const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    // Make sure user owns the comment
    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized to delete this comment' });
    }

    await comment.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  addComment,
  getReelComments,
  toggleLikeComment,
  deleteComment,
};
