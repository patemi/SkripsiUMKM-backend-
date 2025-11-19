const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
    required: [true, 'Username harus diisi'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password_user: {
    type: String,
    required: [true, 'Password harus diisi'],
    minlength: 6,
    select: false
  }
}, {
  timestamps: true
});

// Hash password sebelum save
userSchema.pre('save', async function(next) {
  if (!this.isModified('password_user')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password_user = await bcrypt.hash(this.password_user, salt);
  next();
});

// Method untuk compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password_user);
};

module.exports = mongoose.model('User', userSchema);
