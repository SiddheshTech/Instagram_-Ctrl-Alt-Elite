const mongoose = require('mongoose');

const unfollowRecordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true, // The user who was unfollowed
    },
    unfollowerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true, // The user who did the unfollowing
    },
    unfollowedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('UnfollowRecord', unfollowRecordSchema);
