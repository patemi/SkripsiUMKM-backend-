/**
 * Script untuk update UMKM yang sudah ditolak tapi belum ada alasan_penolakan
 * Jalankan dengan: node updateRejectedUMKM.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const UMKM = require('./models/Umkm');

// Database connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/umkm_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

async function updateRejectedUMKM() {
  try {
    console.log('🔍 Mencari UMKM yang ditolak tanpa alasan...');
    
    // Cari UMKM yang ditolak tapi tidak ada alasan
    const rejectedUMKM = await UMKM.find({
      status: 'rejected',
      $or: [
        { alasan_penolakan: { $exists: false } },
        { alasan_penolakan: '' },
        { alasan_penolakan: null }
      ]
    });

    console.log(`📊 Ditemukan ${rejectedUMKM.length} UMKM yang ditolak tanpa alasan`);

    if (rejectedUMKM.length > 0) {
      console.log('\n📋 Daftar UMKM:');
      rejectedUMKM.forEach((umkm, index) => {
        console.log(`${index + 1}. ${umkm.nama_umkm} (ID: ${umkm._id})`);
      });

      // Update semua dengan alasan default
      const defaultReason = 'Mohon maaf, pengajuan UMKM Anda tidak memenuhi kriteria. Silakan hubungi admin untuk informasi lebih lanjut.';
      
      const result = await UMKM.updateMany(
        {
          status: 'rejected',
          $or: [
            { alasan_penolakan: { $exists: false } },
            { alasan_penolakan: '' },
            { alasan_penolakan: null }
          ]
        },
        {
          $set: { alasan_penolakan: defaultReason }
        }
      );

      console.log(`\n✅ Berhasil update ${result.modifiedCount} UMKM dengan alasan default`);
      console.log(`📝 Alasan default: "${defaultReason}"`);
      console.log('\n💡 Tip: Admin dapat mengupdate alasan ini melalui fitur verifikasi');
    } else {
      console.log('✅ Semua UMKM yang ditolak sudah memiliki alasan');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Jalankan script
updateRejectedUMKM();
