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
const { processImages } = require('../middleware/imageProcessor');

// Public routes
router.get('/', getAllUMKM);
router.get('/top', getTopUMKM);
router.get('/:id', getUMKMById);
router.post('/:id/view', incrementView);

// Protected routes (User/Admin) - dengan image processing
router.post('/', protect, upload.array('foto_umkm', 5), processImages, createUMKM);
router.put('/:id', protect, upload.array('foto_umkm', 5), processImages, updateUMKM);

// Protected routes (User/Admin)
router.delete('/:id', protect, deleteUMKM); // User can delete their own UMKM, Admin can delete any

// Admin only routes
router.post('/:id/verify', protect, adminOnly, verifyUMKM);
router.get('/stats/overview', protect, adminOnly, getStatistics);

module.exports = router;

