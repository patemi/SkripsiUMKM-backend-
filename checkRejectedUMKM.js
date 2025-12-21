/**
 * Script untuk cek data UMKM yang ditolak
 */

require('dotenv').config();
const mongoose = require('mongoose');
const UMKM = require('./models/Umkm');

// Database connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/umkm_db')
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

async function checkRejectedUMKM() {
  try {
    console.log('🔍 Mengambil semua UMKM yang ditolak...\n');
    
    const rejectedUMKM = await UMKM.find({ status: 'rejected' })
      .select('nama_umkm status alasan_penolakan createdAt user_id nama_user')
      .sort({ createdAt: -1 });

    console.log(`📊 Total UMKM yang ditolak: ${rejectedUMKM.length}\n`);

    if (rejectedUMKM.length > 0) {
      rejectedUMKM.forEach((umkm, index) => {
        console.log(`${index + 1}. ${umkm.nama_umkm}`);
        console.log(`   ID: ${umkm._id}`);
        console.log(`   Status: ${umkm.status}`);
        console.log(`   User: ${umkm.nama_user || 'N/A'} (${umkm.user_id})`);
        console.log(`   Alasan: ${umkm.alasan_penolakan || 'TIDAK ADA ALASAN'}`);
        console.log(`   Tanggal: ${umkm.createdAt}\n`);
      });
    } else {
      console.log('✅ Tidak ada UMKM yang ditolak');
    }

    // Juga cek semua UMKM untuk user abimanyu
    console.log('\n🔍 Mencari UMKM milik user abimanyu...\n');
    const User = require('./models/User');
    const user = await User.findOne({ username: 'abimanyu' });
    
    if (user) {
      console.log(`✅ User ditemukan: ${user.nama_user} (ID: ${user._id})\n`);
      
      const userUMKM = await UMKM.find({ user_id: user._id })
        .select('nama_umkm status alasan_penolakan')
        .sort({ createdAt: -1 });
      
      console.log(`📊 Total UMKM milik ${user.nama_user}: ${userUMKM.length}\n`);
      
      if (userUMKM.length > 0) {
        userUMKM.forEach((umkm, index) => {
          console.log(`${index + 1}. ${umkm.nama_umkm}`);
          console.log(`   Status: ${umkm.status}`);
          if (umkm.status === 'rejected') {
            console.log(`   Alasan: ${umkm.alasan_penolakan || 'TIDAK ADA ALASAN'}`);
          }
          console.log('');
        });
      }
    } else {
      console.log('❌ User abimanyu tidak ditemukan');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkRejectedUMKM();
