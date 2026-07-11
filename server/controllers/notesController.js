const Note = require('../models/Note');

// @desc    Create a new note
// @route   POST /api/notes
// @access  Private
const createNote = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.length > 60) {
      return res.status(400).json({ success: false, message: 'Note text must be between 1 and 60 characters' });
    }

    // Usually users only have 1 active note at a time, we could delete previous ones or just add new.
    // For simplicity, we just create a new one and maybe delete existing active ones for this user.
    await Note.deleteMany({ user: req.user._id });

    const note = await Note.create({
      user: req.user._id,
      text,
    });

    res.status(201).json({ success: true, data: note });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get active notes
// @route   GET /api/notes
// @access  Private
const getNotes = async (req, res) => {
  try {
    // In a real app, this would be notes from followed users + self.
    // For now, let's just get all active notes (not expired).
    const activeNotes = await Note.find({
      expiresAt: { $gt: new Date() },
    })
      .populate('user', 'username profilePic')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: activeNotes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  createNote,
  getNotes,
};
