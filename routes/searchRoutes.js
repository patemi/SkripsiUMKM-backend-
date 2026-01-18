const express = require('express');
const router = express.Router();
const { protect: protectAdmin } = require('../middleware/auth');
const {
  searchUMKMAdvanced,
  reindexAllUMKM,
  getSearchStatistics
} = require('../controllers/searchController');

// Public routes
router.get('/', searchUMKMAdvanced);

// Admin routes
router.post('/reindex', protectAdmin, reindexAllUMKM);
router.get('/stats', protectAdmin, getSearchStatistics);

module.exports = router;
