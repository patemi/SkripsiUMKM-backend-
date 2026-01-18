const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    umkm_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UMKM',
        required: true
    }
}, {
    timestamps: true
});

// Ensure unique combination of user and umkm
favoriteSchema.index({ user_id: 1, umkm_id: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);
