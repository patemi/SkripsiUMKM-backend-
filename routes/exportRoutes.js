const express = require('express');
const router = express.Router();
const { exportUMKMToExcel, exportUsersToExcel } = require('../controllers/exportController');
const { protect, adminOnly } = require('../middleware/auth');

// All routes require admin authentication
router.use(protect, adminOnly);

router.get('/umkm', exportUMKMToExcel);
router.get('/users', exportUsersToExcel);

module.exports = router;
