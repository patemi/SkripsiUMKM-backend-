const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const User = require('../models/User');

// Middleware untuk protect routes (admin atau user)
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Tidak ada akses. Token tidak ditemukan'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Cek apakah admin atau user
    if (decoded.role === 'admin' || decoded.role === 'superadmin') {
      req.admin = await Admin.findById(decoded.id).select('-password_admin');
      req.userType = 'admin';
    } else {
      req.user = await User.findById(decoded.id).select('-password_user');
      req.userType = 'user';
    }
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token tidak valid'
    });
  }
};

// Middleware khusus admin
exports.adminOnly = async (req, res, next) => {
  if (req.userType !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Akses ditolak. Hanya admin yang bisa mengakses'
    });
  }
  next();
};

// Generate JWT Token
exports.generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};
