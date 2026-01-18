const mongoose = require('mongoose');
const Umkm = require('./models/Umkm');

mongoose.connect('mongodb://localhost:27017/umkm_db')
  .then(() => console.log('Connected'))
  .catch(err => { console.error(err); process.exit(1); });

async function check() {
  const noLokasi = await Umkm.find({
    status: 'approved',
    $or: [
      { 'lokasi.latitude': { $exists: false } },
      { 'lokasi.latitude': null },
      { 'lokasi.latitude': 0 },
      { 'lokasi': { $exists: false } }
    ]
  });

  console.log(`\nUMKM without valid GPS (${noLokasi.length}):\n`);
  for (const umkm of noLokasi) {
    console.log(`ID: ${umkm._id}`);
    console.log(`Name: ${umkm.nama_umkm}`);
    console.log(`Maps: ${umkm.maps || 'NONE'}`);
    console.log(`Lokasi: ${JSON.stringify(umkm.lokasi)}\n`);
  }

  await mongoose.connection.close();
  process.exit(0);
}

check();
