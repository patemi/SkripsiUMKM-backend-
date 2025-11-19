const express = require('express');
const router = express.Router();
const {
  registerAdmin,
  loginAdmin,
  getAdminProfile,
  getAllAdmins
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

// Public routes
router.post('/register', registerAdmin);
router.post('/login', loginAdmin);

// Protected routes
router.get('/profile', protect, adminOnly, getAdminProfile);
router.get('/', protect, adminOnly, getAllAdmins);

module.exports = router;
