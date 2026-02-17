const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const {
  registerUser,
  loginUser,
  getUserProfile,
  getUserStats,
  getAllUsers,
  updateActivity,
  updateUserProfile,
  changeUserPassword,
  forgotPassword,
  resetPassword,
  googleAuthCallback
} = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/auth');
const { authLimiter, forgotPasswordLimiter } = require('../middleware/rateLimit');

// Public routes - dengan rate limiting untuk mencegah brute force
router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);

// Password reset routes
router.post('/forgot-password', forgotPasswordLimiter, forgotPassword);
router.post('/reset-password', resetPassword);

// Google OAuth routes
router.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/auth/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/user/login?error=google_auth_failed`
  }),
  googleAuthCallback
);

// Protected routes
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.put('/password', protect, changeUserPassword);
router.post('/activity', protect, updateActivity);

// Admin only routes
router.get('/', protect, adminOnly, getAllUsers);
router.get('/stats', protect, adminOnly, getUserStats);

module.exports = router;

