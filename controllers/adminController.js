const Admin = require('../models/Admin');
const { generateToken } = require('../middleware/auth');

// @desc    Register admin
// @route   POST /api/admin/register
// @access  Public (should be protected in production)
exports.registerAdmin = async (req, res) => {
  try {
    const { nama_admin, username_admin, password_admin, role } = req.body;
    
    // Check if admin exists
    const adminExists = await Admin.findOne({ username_admin });
    
    if (adminExists) {
      return res.status(400).json({
        success: false,
        message: 'Username sudah digunakan'
      });
    }
    
    const admin = await Admin.create({
      nama_admin,
      username_admin,
      password_admin,
      role: role || 'admin'
    });
    
    const token = generateToken(admin._id, admin.role);
    
    res.status(201).json({
      success: true,
      message: 'Admin berhasil didaftarkan',
      data: {
        id: admin._id,
        nama_admin: admin.nama_admin,
        username_admin: admin.username_admin,
        role: admin.role
      },
      token
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Gagal mendaftarkan admin',
      error: error.message
    });
  }
};

// @desc    Login admin
// @route   POST /api/admin/login
// @access  Public
exports.loginAdmin = async (req, res) => {
  try {
    const { username_admin, password_admin } = req.body;
    
    if (!username_admin || !password_admin) {
      return res.status(400).json({
        success: false,
        message: 'Username dan password harus diisi'
      });
    }
    
    const admin = await Admin.findOne({ username_admin }).select('+password_admin');
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Username atau password salah'
      });
    }
    
    const isMatch = await admin.comparePassword(password_admin);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Username atau password salah'
      });
    }
    
    const token = generateToken(admin._id, admin.role);
    
    res.status(200).json({
      success: true,
      message: 'Login berhasil',
      data: {
        id: admin._id,
        nama_admin: admin.nama_admin,
        username_admin: admin.username_admin,
        role: admin.role
      },
      token
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal login',
      error: error.message
    });
  }
};

// @desc    Get admin profile
// @route   GET /api/admin/profile
// @access  Private (Admin)
exports.getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id);
    
    res.status(200).json({
      success: true,
      data: admin
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil profil admin',
      error: error.message
    });
  }
};

// @desc    Get all admins
// @route   GET /api/admin
// @access  Private (Superadmin)
exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().select('-password_admin');
    
    res.status(200).json({
      success: true,
      count: admins.length,
      data: admins
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data admin',
      error: error.message
    });
  }
};
