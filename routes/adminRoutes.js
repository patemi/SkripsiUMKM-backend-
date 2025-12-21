const express = require('express');
const router = express.Router();
const {
  registerAdmin,
  loginAdmin,
  getAdminProfile,
  getAllAdmins,
  verifyToken,
  updateAdminProfile,
  updateAdminPassword
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

// Public routes
router.post('/register', registerAdmin);
router.post('/login', loginAdmin);

// Protected routes
router.get('/verify', protect, adminOnly, verifyToken);
router.get('/profile', protect, adminOnly, getAdminProfile);
router.put('/profile', protect, adminOnly, updateAdminProfile);
router.put('/password', protect, adminOnly, updateAdminPassword);
router.get('/', protect, adminOnly, getAllAdmins);

module.exports = router;
