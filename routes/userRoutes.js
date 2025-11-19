const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  getUserStats,
  getAllUsers
} = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/auth');

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes
router.get('/profile', protect, getUserProfile);

// Admin only routes
router.get('/', protect, adminOnly, getAllUsers);
router.get('/stats', protect, adminOnly, getUserStats);

module.exports = router;
