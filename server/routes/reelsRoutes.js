const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

const {
  createReel,
  getReels,
  getReelById,
  toggleLikeReel,
  toggleSaveReel,
  incrementShareReel,
  incrementViewReel,
} = require('../controllers/reelsController');

const {
  addComment,
  getReelComments,
} = require('../controllers/commentsController');

// Reel Routes
router.route('/').post(protect, createReel).get(protect, getReels);
router.route('/:id').get(protect, getReelById);

// Interaction Routes
router.route('/:id/like').put(protect, toggleLikeReel);
router.route('/:id/save').put(protect, toggleSaveReel);
router.route('/:id/share').put(protect, incrementShareReel);
router.route('/:id/view').put(protect, incrementViewReel);

// Comment routes tied to a reel
router.route('/:id/comments')
  .post(protect, addComment)
  .get(protect, getReelComments);

module.exports = router;
