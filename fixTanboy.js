const mongoose = require('./config/database');
const UMKM = require('./models/Umkm');

const updateRumahMakanTanboy = async () => {
  try {
    await mongoose;
    console.log('\n✅ MongoDB Connected');
    
    const result = await UMKM.updateOne(
      { nama_umkm: 'Rumah Makan Tanboy' },
      {
        $set: {
          lokasi: {
            latitude: -7.5558,
            longitude: 110.8290
          }
        }
      }
    );

    console.log('\n📊 Update Result:');
    console.log(`  Matched: ${result.matchedCount}`);
    console.log(`  Modified: ${result.modifiedCount}`);
    
    // Verify
    const updated = await UMKM.findOne({ nama_umkm: 'Rumah Makan Tanboy' });
    if (updated && updated.lokasi) {
      console.log('\n✅ Verified:');
      console.log(`  Nama: ${updated.nama_umkm}`);
      console.log(`  Lokasi: ${updated.lokasi.latitude}, ${updated.lokasi.longitude}`);
      console.log(`  Maps: ${updated.maps}`);
      console.log('\n🗺️  Sekarang UMKM ini akan muncul di map!\n');
    }

    console.log('✅ Done!\n');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

updateRumahMakanTanboy();
