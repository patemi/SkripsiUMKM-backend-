const UMKM = require('../models/Umkm');
const User = require('../models/User');

// @desc    Get growth data (UMKM & Users per month)
// @route   GET /api/growth
// @access  Private (Admin)
exports.getGrowthData = async (req, res) => {
  try {
    // Get current date and calculate 12 months back
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    // Get UMKM growth data (last 12 months)
    const umkmGrowth = await UMKM.aggregate([
      {
        $match: { 
          status: 'approved',
          createdAt: { $gte: twelveMonthsAgo }
        }
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
      }
    ]);

    // Get User growth data (last 12 months)
    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: twelveMonthsAgo }
        }
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

    // Generate all months in order (last 12 months)
    const allMonths = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      allMonths.push(`${year}-${month}`);
    }

    // Build cumulative data
    let cumulativeUMKM = 0;
    let cumulativeUsers = 0;
    
    const growthData = allMonths.map(monthKey => {
      const [year, month] = monthKey.split('-').map(Number);
      const monthName = monthNames[month - 1];
      
      cumulativeUMKM += umkmMap[monthKey] || 0;
      cumulativeUsers += userMap[monthKey] || 0;

      return {
        month: `${monthName} ${year}`,
        umkm: cumulativeUMKM,
        users: cumulativeUsers,
      };
    }).filter(item => item.umkm > 0 || item.users > 0); // Hanya tampilkan bulan yang ada data

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
