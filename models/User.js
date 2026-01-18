const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  nama_user: {
    type: String,
    required: [true, 'Nama user harus diisi'],
    trim: true
  },
  email_user: {
    type: String,
    required: [true, 'Email harus diisi'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Email tidak valid']
  },
  username: {
    type: String,
    required: function () {
      return this.authProvider === 'local';
    },
    unique: true,
    sparse: true, // Allow null values for OAuth users
    lowercase: true,
    trim: true
  },
  password_user: {
    type: String,
    required: function () {
      return this.authProvider === 'local';
    },
    minlength: 8,
    select: false
  },
  // Google OAuth fields
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  profilePicture: {
    type: String,
    default: ''
  },
  // Password reset fields
  resetPasswordToken: {
    type: String,
    select: false
  },
  resetPasswordExpires: {
    type: Date,
    select: false
  },
  lastLogin: {
    type: Date,
    default: null
  },
  lastActivity: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Hash password sebelum save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password_user') || !this.password_user) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password_user = await bcrypt.hash(this.password_user, salt);
  next();
});

// Method untuk compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password_user);
};

// Method untuk generate reset password token
userSchema.methods.generateResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.resetPasswordExpires = Date.now() + 30 * 60 * 1000; // 30 menit

  return resetToken;
};

module.exports = mongoose.model('User', userSchema);

