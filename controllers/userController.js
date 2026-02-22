const User = require('../models/User');
const UMKM = require('../models/Umkm');
const crypto = require('crypto');
const { generateToken } = require('../middleware/auth');
const { isEmailConfigured, sendPasswordResetEmail, sendEmailVerificationCode } = require('../services/emailService');

const FRONTEND_URL = process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production'
  ? 'https://soraumkm.biz.id'
  : 'http://localhost:3000');

// @desc    Register user
// @route   POST /api/user/register
// @access  Public
exports.registerUser = async (req, res) => {
  try {
    const { nama_user, email_user, username, password_user } = req.body;
    const normalizedEmail = email_user?.toLowerCase()?.trim();
    const normalizedUsername = username?.toLowerCase()?.trim();

    if (!nama_user || !normalizedEmail || !normalizedUsername || !password_user) {
      return res.status(400).json({
        success: false,
        message: 'Nama, email, username, dan password harus diisi'
      });
    }

    if (password_user.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password minimal 8 karakter'
      });
    }

    // Check if user exists by email or username
    const existingUser = await User.findOne({
      $or: [{ email_user: normalizedEmail }, { username: normalizedUsername }]
    });

    let user;

    if (existingUser) {
      // Jika akun local belum verifikasi dengan email yang sama, update data dan kirim ulang kode verifikasi
      if (existingUser.email_user === normalizedEmail && !existingUser.isEmailVerified && existingUser.authProvider === 'local') {
        existingUser.nama_user = nama_user;
        existingUser.username = normalizedUsername;
        existingUser.password_user = password_user;
        user = existingUser;
      } else {
        return res.status(400).json({
          success: false,
          message: 'Email atau username sudah digunakan'
        });
      }
    } else {
      user = new User({
        nama_user,
        email_user: normalizedEmail,
        username: normalizedUsername,
        password_user,
        authProvider: 'local',
        isEmailVerified: false
      });
    }

    const verificationCode = user.generateEmailVerificationCode();

    await user.save();

    if (!isEmailConfigured()) {
      if (process.env.NODE_ENV === 'production') {
        user.emailVerificationCode = undefined;
        user.emailVerificationExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return res.status(500).json({
          success: false,
          message: 'Layanan email belum dikonfigurasi. Hubungi admin sistem.'
        });
      }

      console.log('=================================');
      console.log('📩 EMAIL VERIFICATION CODE (DEV MODE)');
      console.log('Email:', user.email_user);
      console.log('Code:', verificationCode);
      console.log('=================================');
    } else {
      try {
        await sendEmailVerificationCode({
          to: user.email_user,
          name: user.nama_user,
          code: verificationCode,
        });
      } catch (mailError) {
        console.error('Failed sending verification email:', mailError.message);

        user.emailVerificationCode = undefined;
        user.emailVerificationExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return res.status(500).json({
          success: false,
          message: 'Gagal mengirim kode verifikasi. Silakan coba beberapa saat lagi.'
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil. Kode verifikasi telah dikirim ke email Anda.',
      data: {
        id: user._id,
        nama_user: user.nama_user,
        email_user: user.email_user,
        username: user.username
      },
      requiresEmailVerification: true,
      ...(process.env.NODE_ENV === 'development' && { verificationCode })
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

    if (user.authProvider === 'google' && !user.password_user) {
      return res.status(400).json({
        success: false,
        message: 'Akun ini terdaftar dengan Google. Silakan login menggunakan tombol Google.'
      });
    }

    if (user.authProvider === 'local' && !user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Email belum diverifikasi. Silakan cek email Anda dan masukkan kode verifikasi terlebih dahulu.',
        requiresEmailVerification: true,
        email: user.email_user
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

// @desc    Verify user email with code
// @route   POST /api/user/verify-email
// @access  Public
exports.verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email dan kode verifikasi harus diisi'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const hashedCode = crypto
      .createHash('sha256')
      .update(String(code).trim())
      .digest('hex');

    const user = await User.findOne({
      email_user: normalizedEmail,
      authProvider: 'local'
    }).select('+emailVerificationCode +emailVerificationExpires');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Email atau kode verifikasi tidak valid'
      });
    }

    if (user.isEmailVerified) {
      return res.status(200).json({
        success: true,
        message: 'Email sudah terverifikasi. Silakan login.'
      });
    }

    if (
      !user.emailVerificationCode ||
      !user.emailVerificationExpires ||
      user.emailVerificationExpires < Date.now() ||
      user.emailVerificationCode !== hashedCode
    ) {
      return res.status(400).json({
        success: false,
        message: 'Kode verifikasi tidak valid atau sudah kadaluarsa'
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationCode = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Email berhasil diverifikasi. Silakan login.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal memverifikasi email',
      error: error.message
    });
  }
};

// @desc    Resend email verification code
// @route   POST /api/user/resend-verification-code
// @access  Public
exports.resendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email harus diisi'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({
      email_user: normalizedEmail,
      authProvider: 'local'
    }).select('+emailVerificationCode +emailVerificationExpires');

    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'Jika email terdaftar, kode verifikasi akan dikirim'
      });
    }

    if (user.isEmailVerified) {
      return res.status(200).json({
        success: true,
        message: 'Email sudah terverifikasi. Silakan login.'
      });
    }

    const verificationCode = user.generateEmailVerificationCode();
    await user.save({ validateBeforeSave: false });

    if (!isEmailConfigured()) {
      if (process.env.NODE_ENV === 'production') {
        user.emailVerificationCode = undefined;
        user.emailVerificationExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return res.status(500).json({
          success: false,
          message: 'Layanan email belum dikonfigurasi. Hubungi admin sistem.'
        });
      }

      console.log('=================================');
      console.log('📩 RESEND VERIFICATION CODE (DEV MODE)');
      console.log('Email:', normalizedEmail);
      console.log('Code:', verificationCode);
      console.log('=================================');
    } else {
      try {
        await sendEmailVerificationCode({
          to: user.email_user,
          name: user.nama_user,
          code: verificationCode,
        });
      } catch (mailError) {
        user.emailVerificationCode = undefined;
        user.emailVerificationExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return res.status(500).json({
          success: false,
          message: 'Gagal mengirim ulang kode verifikasi. Silakan coba lagi.'
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Kode verifikasi telah dikirim ke email Anda.',
      ...(process.env.NODE_ENV === 'development' && { verificationCode })
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengirim ulang kode verifikasi',
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
    const resetUrl = `${FRONTEND_URL}/user/reset-password?token=${resetToken}`;

    if (!isEmailConfigured()) {
      if (process.env.NODE_ENV === 'production') {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return res.status(500).json({
          success: false,
          message: 'Layanan email belum dikonfigurasi. Hubungi admin sistem.'
        });
      }

      console.log('=================================');
      console.log('🔑 PASSWORD RESET TOKEN (DEV MODE)');
      console.log('Email:', email);
      console.log('Token:', resetToken);
      console.log('Reset URL:', resetUrl);
      console.log('Expires in 30 minutes');
      console.log('=================================');
    } else {
      try {
        await sendPasswordResetEmail({
          to: user.email_user,
          name: user.nama_user,
          resetUrl,
        });
      } catch (mailError) {
        console.error('Failed sending reset password email:', mailError.message);

        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return res.status(500).json({
          success: false,
          message: 'Gagal mengirim email reset password. Silakan coba beberapa saat lagi.'
        });
      }
    }

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
      return res.redirect(`${FRONTEND_URL}/user/login?error=auth_failed`);
    }

    // Generate JWT token
    const token = generateToken(user._id, 'user');

    // Redirect ke frontend dengan token (gunakan path NON-API agar tidak tertabrak reverse proxy /api -> backend)
    const frontendUrl = FRONTEND_URL;
    res.redirect(`${frontendUrl}/user/auth/google/callback?token=${token}&userId=${user._id}&name=${encodeURIComponent(user.nama_user)}&email=${encodeURIComponent(user.email_user)}`);
  } catch (error) {
    console.error('Google auth callback error:', error);
    res.redirect(`${FRONTEND_URL}/user/login?error=auth_failed`);
  }
};
