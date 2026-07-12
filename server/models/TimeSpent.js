const mongoose = require('mongoose');

const timeSpentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: String, // format: YYYY-MM-DD
      required: true,
      index: true,
    },
    minutes: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to quickly find/update a user's record for a specific day
timeSpentSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('TimeSpent', timeSpentSchema);
