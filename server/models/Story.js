const mongoose = require('mongoose');

const storySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    mediaUrl: {
      type: String,
      required: [true, 'Media URL is required'],
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: '0' } // TTL index: document will auto-delete when expiresAt is reached
    },
    viewers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Story = mongoose.model('Story', storySchema);

module.exports = Story;
