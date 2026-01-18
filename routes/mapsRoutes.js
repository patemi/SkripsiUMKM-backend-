const express = require('express');
const router = express.Router();
const {
    resolveShortlink,
    extractCoordinates,
    validateMapsUrl
} = require('../controllers/mapsController');

// Public routes - no auth required
router.post('/resolve', resolveShortlink);
router.post('/coordinates', extractCoordinates);
router.post('/validate', validateMapsUrl);

module.exports = router;
