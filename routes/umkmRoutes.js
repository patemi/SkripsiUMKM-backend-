const express = require('express');
const router = express.Router();
const {
  getAllUMKM,
  getUMKMById,
  createUMKM,
  updateUMKM,
  deleteUMKM,
  verifyUMKM,
  getStatistics,
  getTopUMKM,
  incrementView
} = require('../controllers/umkmController');
const { protect, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes
router.get('/', getAllUMKM);
router.get('/top', getTopUMKM);
router.get('/:id', getUMKMById);
router.post('/:id/view', incrementView);

// Protected routes (User/Admin)
router.post('/', protect, upload.array('foto_umkm', 5), createUMKM);
router.put('/:id', protect, upload.array('foto_umkm', 5), updateUMKM);

// Admin only routes
router.delete('/:id', protect, adminOnly, deleteUMKM);
router.post('/:id/verify', protect, adminOnly, verifyUMKM);
router.get('/stats/overview', protect, adminOnly, getStatistics);

module.exports = router;
