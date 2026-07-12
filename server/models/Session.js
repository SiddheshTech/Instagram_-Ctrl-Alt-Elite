const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
    },
    device: {
      type: String,
      default: 'Unknown Device',
    },
    location: {
      type: String,
      default: 'Unknown Location',
    },
    ipAddress: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    wasConfirmed: {
      type: Boolean,
      default: null, // null = pending, true = verified, false = rejected
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Session', sessionSchema);
