const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

const {
  toggleLikeComment,
  deleteComment,
} = require('../controllers/commentsController');

// Direct comment interactions
router.route('/:id/like').put(protect, toggleLikeComment);
router.route('/:id').delete(protect, deleteComment);

module.exports = router;
