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

    const comment = await Comment.create({
      user: req.user._id,
      reel: reelId,
      text,
    });

    const populatedComment = await comment.populate('user', 'username profilePic');

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
