const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  admin_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  admin_name: {
    type: String,
    required: true
  },
  umkm_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UMKM',
    required: true
  },
  umkm_nama: {
    type: String,
    required: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  user_name: {
    type: String,
    default: 'Unknown'
  },
  action: {
    type: String,
    enum: ['approved', 'rejected'],
    required: true
  },
  reason: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index untuk query
activityLogSchema.index({ admin_id: 1 });
activityLogSchema.index({ umkm_id: 1 });
activityLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
