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

// @desc    Verify admin token
// @route   GET /api/admin/verify
// @access  Private (Admin)
exports.verifyToken = async (req, res) => {
  try {
    // req.admin sudah di-set oleh middleware protect
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Token tidak valid'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Token valid',
      data: {
        id: req.admin._id,
        nama_admin: req.admin.nama_admin,
        username_admin: req.admin.username_admin,
        role: req.admin.role
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token tidak valid',
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

// @desc    Update admin profile
// @route   PUT /api/admin/profile
// @access  Private (Admin)
exports.updateAdminProfile = async (req, res) => {
  try {
    const { nama_admin, username_admin } = req.body;
    
    console.log('Update profile request:', { nama_admin, username_admin, adminId: req.admin._id });
    
    // Check if new username already exists (if username is being changed)
    if (username_admin && username_admin !== req.admin.username_admin) {
      const usernameExists = await Admin.findOne({ username_admin });
      if (usernameExists) {
        return res.status(400).json({
          success: false,
          message: 'Username sudah digunakan'
        });
      }
    }
    
    const updateData = {};
    if (nama_admin) updateData.nama_admin = nama_admin;
    if (username_admin) updateData.username_admin = username_admin;
    
    console.log('Updating with data:', updateData);
    
    const admin = await Admin.findByIdAndUpdate(
      req.admin._id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );
    
    console.log('Update successful:', admin);
    
    res.status(200).json({
      success: true,
      message: 'Profil berhasil diperbarui',
      data: {
        id: admin._id,
        nama_admin: admin.nama_admin,
        username_admin: admin.username_admin,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(400).json({
      success: false,
      message: 'Gagal memperbarui profil',
      error: error.message
    });
  }
};

// @desc    Update admin password
// @route   PUT /api/admin/password
// @access  Private (Admin)
exports.updateAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password lama dan password baru harus diisi'
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password baru minimal 6 karakter'
      });
    }
    
    // Get admin with password
    const admin = await Admin.findById(req.admin._id).select('+password_admin');
    
    // Check current password
    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Password lama tidak sesuai'
      });
    }
    
    // Update password
    admin.password_admin = newPassword;
    await admin.save();
    
    res.status(200).json({
      success: true,
      message: 'Password berhasil diperbarui'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Gagal memperbarui password',
      error: error.message
    });
  }
};
