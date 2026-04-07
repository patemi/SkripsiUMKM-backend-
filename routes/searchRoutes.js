const express = require('express');
const router = express.Router();
const { protect: protectAdmin } = require('../middleware/auth');
const {
  searchUMKMAdvanced,
  getAISearchSuggestions,
  reindexAllUMKM,
  getSearchStatistics
} = require('../controllers/searchController');

// Public routes
router.get('/', searchUMKMAdvanced);
router.get('/suggest', getAISearchSuggestions);

// Admin routes
router.post('/reindex', protectAdmin, reindexAllUMKM);
router.get('/stats', protectAdmin, getSearchStatistics);

module.exports = router;
