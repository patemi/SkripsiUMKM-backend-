// Add sample data for better chart visualization
// Run: node addSampleData.js

require('dotenv').config();
const mongoose = require('mongoose');
const UMKM = require('./models/Umkm');
const User = require('./models/User');

const addSampleData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ MongoDB Connected');

    // Get existing data
    const existingUMKM = await UMKM.find({ status: 'approved' });
    const existingUsers = await User.find();

    console.log(`Current data: ${existingUMKM.length} UMKM, ${existingUsers.length} Users`);

    // Add historical dates (backdate some records)
    const months = [
      { month: 7, year: 2025, umkmCount: 1, userCount: 1 },  // Juli
      { month: 8, year: 2025, umkmCount: 1, userCount: 0 },  // Agustus
      { month: 9, year: 2025, umkmCount: 1, userCount: 0 },  // September
      { month: 10, year: 2025, umkmCount: 1, userCount: 1 }, // Oktober
    ];

    let totalAdded = 0;

    for (const data of months) {
      const date = new Date(data.year, data.month - 1, 15); // 15th of each month

      // Add UMKM for this month
      for (let i = 0; i < data.umkmCount; i++) {
        const umkm = await UMKM.create({
          nama_umkm: `UMKM Sample ${data.month}-${i + 1}`,
          kategori: ['Kuliner', 'Fashion', 'Kerajinan', 'Jasa'][i % 4],
          deskripsi: `UMKM untuk data historis bulan ${data.month}`,
          pembayaran: ['Tunai', 'QRIS'],
          alamat: 'Jl. Sample Street No. 123',
          maps: 'https://maps.google.com',
          jam_operasional: {
            senin: '08:00 - 17:00',
            selasa: '08:00 - 17:00',
            rabu: '08:00 - 17:00',
            kamis: '08:00 - 17:00',
            jumat: '08:00 - 17:00',
            sabtu: '08:00 - 15:00',
            minggu: 'Tutup'
          },
          kontak: {
            telepon: '081234567890',
            whatsapp: '081234567890',
            email: 'sample@email.com',
            instagram: '@sample',
            facebook: 'Sample'
          },
          foto_umkm: [],
          status: 'approved',
          views: Math.floor(Math.random() * 100),
          user_id: existingUsers[0]._id,
          createdAt: date,
          updatedAt: date
        });
        totalAdded++;
        console.log(`✓ Added UMKM for ${data.month}/2025`);
      }

      // Add Users for this month
      for (let i = 0; i < data.userCount; i++) {
        const user = await User.create({
          nama_user: `User Sample ${data.month}-${i + 1}`,
          email_user: `user_${data.month}_${i + 1}@sample.com`,
          username: `user_${data.month}_${i + 1}`,
          password_user: 'sample123',
          createdAt: date,
          updatedAt: date
        });
        totalAdded++;
        console.log(`✓ Added User for ${data.month}/2025`);
      }
    }

    console.log(`\n✅ Added ${totalAdded} sample records for historical data`);
    console.log('Run "node testGrowth.js" to verify growth data');

    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

addSampleData();
