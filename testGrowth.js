// Test Growth API
// Run: node testGrowth.js

require('dotenv').config();
const mongoose = require('mongoose');
const UMKM = require('./models/Umkm');
const User = require('./models/User');

const testGrowth = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ MongoDB Connected');

    // Check UMKM count
    const totalUMKM = await UMKM.countDocuments({ status: 'approved' });
    console.log(`✓ Total UMKM (approved): ${totalUMKM}`);

    // Check User count
    const totalUsers = await User.countDocuments();
    console.log(`✓ Total Users: ${totalUsers}`);

    // Get UMKM growth
    const umkmGrowth = await UMKM.aggregate([
      { $match: { status: 'approved' } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    console.log('\n✓ UMKM Growth by Month:');
    console.log(JSON.stringify(umkmGrowth, null, 2));

    // Get User growth
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
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    console.log('\n✓ User Growth by Month:');
    console.log(JSON.stringify(userGrowth, null, 2));

    // Build growth data
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

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

    const allMonths = new Set();
    umkmGrowth.forEach(item => allMonths.add(`${item._id.year}-${item._id.month}`));
    userGrowth.forEach(item => allMonths.add(`${item._id.year}-${item._id.month}`));

    const sortedMonths = Array.from(allMonths).sort();

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

    console.log('\n✓ Final Growth Data for Chart:');
    console.log(JSON.stringify(growthData, null, 2));

    if (growthData.length === 0) {
      console.log('\n⚠️  WARNING: No growth data found!');
      console.log('Run "npm run seed" to populate database with sample data.');
    } else {
      console.log(`\n✅ SUCCESS! Found ${growthData.length} data points for chart.`);
    }

    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

testGrowth();
