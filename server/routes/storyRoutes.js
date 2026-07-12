const express = require('express');
const router = express.Router();
const { createStory, getStories } = require('../controllers/storyController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, createStory)
  .get(protect, getStories);

module.exports = router;
