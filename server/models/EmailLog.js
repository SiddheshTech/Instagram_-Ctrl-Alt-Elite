const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      enum: ['security', 'other'],
      default: 'other',
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('EmailLog', emailLogSchema);
