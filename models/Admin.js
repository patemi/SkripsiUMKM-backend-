const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  nama_admin: {
    type: String,
    required: [true, 'Nama admin harus diisi'],
    trim: true
  },
  username_admin: {
    type: String,
    required: [true, 'Username harus diisi'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password_admin: {
    type: String,
    required: [true, 'Password harus diisi'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    default: 'admin',
    enum: ['admin', 'superadmin']
  }
}, {
  timestamps: true
});

// Hash password sebelum save
adminSchema.pre('save', async function(next) {
  if (!this.isModified('password_admin')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password_admin = await bcrypt.hash(this.password_admin, salt);
  next();
});

// Method untuk compare password
adminSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password_admin);
};

module.exports = mongoose.model('Admin', adminSchema);
