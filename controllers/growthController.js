const UMKM = require('../models/Umkm');
const User = require('../models/User');

// @desc    Get growth data (UMKM & Users per month)
// @route   GET /api/growth
// @access  Private (Admin)
exports.getGrowthData = async (req, res) => {
  try {
    // Get UMKM growth data (last 12 months)
    const umkmGrowth = await UMKM.aggregate([
      {
        $match: { status: 'approved' }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      },
      {
        $limit: 12
      }
    ]);

    // Get User growth data (last 12 months)
    const userGrowth = await User.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      },
      {
        $limit: 12
      }
    ]);

    // Map month names
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    // Create a map for easier lookup
    const umkmMap = {};
    umkmGrowth.forEach(item => {
      const key = `${item._id.year}-${item._id.month}`;
      umkmMap[key] = item.count;
    });

    const userMap = {};
    userGrowth.forEach(item => {
      const key = `${item._id.year}-${item._id.month}`;
      userMap[key] = item.count;
    });

    // Get all unique months
    const allMonths = new Set();
    umkmGrowth.forEach(item => {
      allMonths.add(`${item._id.year}-${item._id.month}`);
    });
    userGrowth.forEach(item => {
      allMonths.add(`${item._id.year}-${item._id.month}`);
    });

    // Convert to array and sort
    const sortedMonths = Array.from(allMonths).sort();

    // Build cumulative data
    let cumulativeUMKM = 0;
    let cumulativeUsers = 0;
    
    const growthData = sortedMonths.map(monthKey => {
      const [year, month] = monthKey.split('-').map(Number);
      const monthName = monthNames[month - 1];
      
      cumulativeUMKM += umkmMap[monthKey] || 0;
      cumulativeUsers += userMap[monthKey] || 0;

      return {
        month: `${monthName} ${year}`,
        umkm: cumulativeUMKM,
        users: cumulativeUsers,
      };
    });

    // If no data, return current month with 0
    if (growthData.length === 0) {
      const now = new Date();
      const currentMonth = monthNames[now.getMonth()];
      const currentYear = now.getFullYear();
      
      growthData.push({
        month: `${currentMonth} ${currentYear}`,
        umkm: 0,
        users: 0,
      });
    }

    res.status(200).json({
      success: true,
      count: growthData.length,
      data: growthData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data pertumbuhan',
      error: error.message
    });
  }
};
