const express = require('express');
const router = express.Router();
const {
  getAllActivityLogs,
  getActivityLogsByAdmin,
  getActivityLogsByUMKM
} = require('../controllers/activityLogController');
const { protect, adminOnly } = require('../middleware/auth');

// All routes require admin authentication
router.get('/', protect, adminOnly, getAllActivityLogs);
router.get('/admin/:adminId', protect, adminOnly, getActivityLogsByAdmin);
router.get('/umkm/:umkmId', protect, adminOnly, getActivityLogsByUMKM);

module.exports = router;
