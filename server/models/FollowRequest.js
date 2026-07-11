const mongoose = require('mongoose');

const followRequestSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// A sender can have only one active request to a recipient
followRequestSchema.index({ sender: 1, recipient: 1 }, { unique: true });

module.exports = mongoose.model('FollowRequest', followRequestSchema);
