const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

const {
  createNote,
  getNotes,
} = require('../controllers/notesController');

router.route('/').post(protect, createNote).get(protect, getNotes);

module.exports = router;
