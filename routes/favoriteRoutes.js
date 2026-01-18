const express = require('express');
const router = express.Router();
const {
    addFavorite,
    removeFavorite,
    getUserFavorites,
    checkFavorite
} = require('../controllers/favoriteController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.get('/', getUserFavorites);
router.get('/check/:umkmId', checkFavorite);
router.post('/:umkmId', addFavorite);
router.delete('/:umkmId', removeFavorite);

module.exports = router;
