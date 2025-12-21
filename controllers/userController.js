const User = require('../models/User');
const UMKM = require('../models/Umkm');
const { generateToken } = require('../middleware/auth');

// @desc    Register user
// @route   POST /api/user/register
// @access  Public
exports.registerUser = async (req, res) => {
  try {
    const { nama_user, email_user, username, password_user } = req.body;
    
    // Check if user exists
    const userExists = await User.findOne({ 
      $or: [{ email_user }, { username }] 
    });
    
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Email atau username sudah digunakan'
      });
    }
    
    const user = await User.create({
      nama_user,
      email_user,
      username,
      password_user
    });
    
    const token = generateToken(user._id, 'user');
    
    res.status(201).json({
      success: true,
      message: 'User berhasil didaftarkan',
      data: {
        id: user._id,
        nama_user: user.nama_user,
        email_user: user.email_user,
        username: user.username
      },
      token
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Gagal mendaftarkan user',
      error: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/user/login
// @access  Public
exports.loginUser = async (req, res) => {
  try {
    const { username, password_user } = req.body;
    
    if (!username || !password_user) {
      return res.status(400).json({
        success: false,
        message: 'Username dan password harus diisi'
      });
    }
    
    const user = await User.findOne({ 
      $or: [{ username }, { email_user: username }] 
    }).select('+password_user');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Username atau password salah'
      });
    }
    
    const isMatch = await user.comparePassword(password_user);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Username atau password salah'
      });
    }
    
    // Update lastLogin dan lastActivity
    user.lastLogin = new Date();
    user.lastActivity = new Date();
    await user.save();
    
    const token = generateToken(user._id, 'user');
    
    res.status(200).json({
      success: true,
      message: 'Login berhasil',
      data: {
        id: user._id,
        nama_user: user.nama_user,
        email_user: user.email_user,
        username: user.username,
        lastLogin: user.lastLogin,
        lastActivity: user.lastActivity
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

// @desc    Get user profile
// @route   GET /api/user/profile
// @access  Private (User)
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil profil user',
      error: error.message
    });
  }
};

// @desc    Get user statistics
// @route   GET /api/user/stats
// @access  Private (Admin)
exports.getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    
    // Get users per month for last 12 months
    const userGrowth = await User.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        growth: userGrowth
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil statistik user',
      error: error.message
    });
  }
};

// @desc    Get all users
// @route   GET /api/user
// @access  Private (Admin)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password_user')
      .sort({ lastActivity: -1, createdAt: -1 });
    
    // Hitung kontribusi UMKM untuk setiap user
    const usersWithContribution = await Promise.all(
      users.map(async (user) => {
        const approvedCount = await UMKM.countDocuments({ 
          user_id: user._id, 
          status: 'approved' 
        });
        
        const rejectedCount = await UMKM.countDocuments({ 
          user_id: user._id, 
          status: 'rejected' 
        });
        
        const totalUMKM = approvedCount + rejectedCount;
        
        return {
          ...user.toObject(),
          umkmContribution: {
            approved: approvedCount,
            rejected: rejectedCount,
            total: totalUMKM
          }
        };
      })
    );
    
    res.status(200).json({
      success: true,
      count: usersWithContribution.length,
      data: usersWithContribution
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data user',
      error: error.message
    });
  }
};

// @desc    Update user activity
// @route   POST /api/user/activity
// @access  Private (User)
exports.updateActivity = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }
    
    user.lastActivity = new Date();
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Activity updated',
      data: {
        lastActivity: user.lastActivity
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal update activity',
      error: error.message
    });
  }
};
