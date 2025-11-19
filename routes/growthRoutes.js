const express = require('express');
const router = express.Router();
const { getGrowthData } = require('../controllers/growthController');
const { protect, adminOnly } = require('../middleware/auth');

// Admin only route
router.get('/', protect, adminOnly, getGrowthData);

module.exports = router;
