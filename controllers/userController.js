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

// @desc    Update user profile
// @route   PUT /api/user/profile
// @access  Private (User)
exports.updateUserProfile = async (req, res) => {
  try {
    const { nama_user, email_user } = req.body;

    // Validation
    if (!nama_user || !email_user) {
      return res.status(400).json({
        success: false,
        message: 'Nama dan email harus diisi'
      });
    }

    // Check if email already exists (excluding current user)
    if (email_user) {
      const existingUser = await User.findOne({
        email_user: email_user.toLowerCase(),
        _id: { $ne: req.user._id }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email sudah terdaftar'
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        nama_user: nama_user.trim(),
        email_user: email_user.toLowerCase().trim()
      },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profil berhasil diperbarui',
      data: {
        _id: user._id,
        nama_user: user.nama_user,
        email_user: user.email_user,
        username: user.username,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui profil',
      error: error.message
    });
  }
};

// @desc    Change user password
// @route   PUT /api/user/password
// @access  Private (User)
exports.changeUserPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password saat ini dan password baru harus diisi'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password baru minimal 8 karakter'
      });
    }

    // Get user with password field
    const user = await User.findById(req.user._id).select('+password_user');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Password saat ini tidak sesuai'
      });
    }

    // Update password
    user.password_user = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password berhasil diubah'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengubah password',
      error: error.message
    });
  }
};

// @desc    Forgot password - request reset token
// @route   POST /api/user/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email harus diisi'
      });
    }

    const user = await User.findOne({ email_user: email.toLowerCase() });

    if (!user) {
      // Untuk keamanan, jangan beritahu bahwa email tidak ditemukan
      return res.status(200).json({
        success: true,
        message: 'Jika email terdaftar, link reset password akan dikirim'
      });
    }

    // Generate reset token
    const resetToken = user.generateResetToken();
    await user.save({ validateBeforeSave: false });

    // Buat reset URL
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/user/reset-password?token=${resetToken}`;

    // Log token untuk development (production harus kirim email)
    console.log('=================================');
    console.log('🔑 PASSWORD RESET TOKEN');
    console.log('Email:', email);
    console.log('Token:', resetToken);
    console.log('Reset URL:', resetUrl);
    console.log('Expires in 30 minutes');
    console.log('=================================');

    // TODO: Implementasi pengiriman email dengan nodemailer
    // Untuk sekarang, token di-log ke console

    res.status(200).json({
      success: true,
      message: 'Jika email terdaftar, link reset password akan dikirim',
      // Hanya tampilkan resetUrl di development
      ...(process.env.NODE_ENV === 'development' && { resetUrl })
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal memproses permintaan reset password',
      error: error.message
    });
  }
};

// @desc    Reset password dengan token
// @route   POST /api/user/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token dan password baru harus diisi'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password baru minimal 8 karakter'
      });
    }

    // Hash token untuk matching dengan yang di database
    const crypto = require('crypto');
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Cari user dengan token yang valid dan belum expired
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    }).select('+resetPasswordToken +resetPasswordExpires');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token tidak valid atau sudah expired'
      });
    }

    // Update password
    user.password_user = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.authProvider = 'local'; // Ensure user can login with password
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password berhasil direset. Silakan login dengan password baru.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal reset password',
      error: error.message
    });
  }
};

// @desc    Google OAuth callback handler
// @route   GET /api/user/auth/google/callback
// @access  Public
exports.googleAuthCallback = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/user/login?error=auth_failed`);
    }

    // Generate JWT token
    const token = generateToken(user._id, 'user');

    // Redirect ke frontend dengan token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/api/auth/google/callback?token=${token}&userId=${user._id}&name=${encodeURIComponent(user.nama_user)}&email=${encodeURIComponent(user.email_user)}`);
  } catch (error) {
    console.error('Google auth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/user/login?error=auth_failed`);
  }
};
