const ActivityLog = require('../models/ActivityLog');

// @desc    Get all activity logs
// @route   GET /api/activity-logs
// @access  Private (Admin)
exports.getAllActivityLogs = async (req, res) => {
  try {
    const logs = await ActivityLog.find()
      .populate('admin_id', 'nama_admin username_admin')
      .populate('umkm_id', 'nama_umkm')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil activity logs',
      error: error.message
    });
  }
};

// @desc    Get activity logs by admin
// @route   GET /api/activity-logs/admin/:adminId
// @access  Private (Admin)
exports.getActivityLogsByAdmin = async (req, res) => {
  try {
    const logs = await ActivityLog.find({ admin_id: req.params.adminId })
      .populate('umkm_id', 'nama_umkm')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil activity logs',
      error: error.message
    });
  }
};

// @desc    Get activity logs by UMKM
// @route   GET /api/activity-logs/umkm/:umkmId
// @access  Private (Admin)
exports.getActivityLogsByUMKM = async (req, res) => {
  try {
    const logs = await ActivityLog.find({ umkm_id: req.params.umkmId })
      .populate('admin_id', 'nama_admin username_admin')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil activity logs',
      error: error.message
    });
  }
};
