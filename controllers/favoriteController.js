const Favorite = require('../models/Favorite');
const UMKM = require('../models/Umkm');

// @desc    Add UMKM to favorites
// @route   POST /api/favorites/:umkmId
// @access  Private
exports.addFavorite = async (req, res) => {
    try {
        const { umkmId } = req.params;
        const userId = req.user._id;

        // Check if UMKM exists
        const umkm = await UMKM.findById(umkmId);
        if (!umkm) {
            return res.status(404).json({
                success: false,
                message: 'UMKM tidak ditemukan'
            });
        }

        // Check if already favorited
        const existing = await Favorite.findOne({ user_id: userId, umkm_id: umkmId });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'UMKM sudah ada di favorit'
            });
        }

        // Create favorite
        const favorite = await Favorite.create({
            user_id: userId,
            umkm_id: umkmId
        });

        res.status(201).json({
            success: true,
            message: 'UMKM berhasil ditambahkan ke favorit',
            data: favorite
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Gagal menambahkan favorit',
            error: error.message
        });
    }
};

// @desc    Remove UMKM from favorites
// @route   DELETE /api/favorites/:umkmId
// @access  Private
exports.removeFavorite = async (req, res) => {
    try {
        const { umkmId } = req.params;
        const userId = req.user._id;

        const favorite = await Favorite.findOneAndDelete({
            user_id: userId,
            umkm_id: umkmId
        });

        if (!favorite) {
            return res.status(404).json({
                success: false,
                message: 'Favorit tidak ditemukan'
            });
        }

        res.status(200).json({
            success: true,
            message: 'UMKM berhasil dihapus dari favorit'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Gagal menghapus favorit',
            error: error.message
        });
    }
};

// @desc    Get user's favorites
// @route   GET /api/favorites
// @access  Private
exports.getUserFavorites = async (req, res) => {
    try {
        const userId = req.user._id;

        const favorites = await Favorite.find({ user_id: userId })
            .populate({
                path: 'umkm_id',
                populate: { path: 'user_id', select: 'nama_user' }
            })
            .sort({ createdAt: -1 });

        // Filter out favorites where UMKM might have been deleted
        const validFavorites = favorites.filter(f => f.umkm_id);

        res.status(200).json({
            success: true,
            count: validFavorites.length,
            data: validFavorites.map(f => f.umkm_id)
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil daftar favorit',
            error: error.message
        });
    }
};

// @desc    Check if UMKM is favorited
// @route   GET /api/favorites/check/:umkmId
// @access  Private
exports.checkFavorite = async (req, res) => {
    try {
        const { umkmId } = req.params;
        const userId = req.user._id;

        const favorite = await Favorite.findOne({
            user_id: userId,
            umkm_id: umkmId
        });

        res.status(200).json({
            success: true,
            isFavorited: !!favorite
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Gagal mengecek favorit',
            error: error.message
        });
    }
};
