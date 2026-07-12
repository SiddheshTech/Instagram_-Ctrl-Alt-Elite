const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, 'Username must be at least 3 characters'],
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    profilePic: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: '',
      maxlength: [150, 'Bio cannot exceed 150 characters'],
    },
    website: {
      type: String,
      default: '',
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    accountType: {
      type: String,
      enum: ['personal', 'professional'],
      default: 'personal',
    },
    showActivityStatus: {
      type: Boolean,
      default: true,
    },
    allowStorySharing: {
      type: Boolean,
      default: true,
    },
    dailyTimeLimit: {
      type: Number,
      default: 0, // In minutes, 0 = Off
    },
    breakReminder: {
      type: Number,
      default: 0, // In minutes, 0 = Off
    },
    mutePushNotifications: {
      type: Boolean,
      default: false,
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    customStatus: {
      type: String,
      default: '',
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    topFriends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    nowPlaying: {
      title: { type: String, default: '' },
      artist: { type: String, default: '' },
      audioUrl: { type: String, default: '' },
    },
    dailyTimeLimit: {
      type: Number,
      default: 0,
    },
    breakReminder: {
      type: Number,
      default: 0,
    },
    mutePushNotifications: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Encrypt password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare user password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
