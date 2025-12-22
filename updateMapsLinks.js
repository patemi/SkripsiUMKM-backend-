const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const UMKM = require('./models/Umkm');

const updateCoordinates = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/umkm_db');
    console.log('Connected to MongoDB');

    // Update existing UMKM with real coordinates (Solo, Indonesia)
    const updates = [
      {
        name: /Warung Makan Bu Siti/i,
        maps: 'https://maps.google.com/maps?q=-7.5560,110.8280'
      },
      {
        name: /Sup Buntut/i,
        maps: 'https://maps.google.com/maps?q=-7.5650,110.8350'
      },
      {
        name: /Batik Nusantara/i,
        maps: 'https://maps.google.com/maps?q=-7.5700,110.8400'
      },
      {
        name: /Kerajinan Bambu/i,
        maps: 'https://maps.google.com/maps?q=-7.5800,110.8500'
      },
      {
        name: /Laundry Express/i,
        maps: 'https://maps.google.com/maps?q=-7.5900,110.8600'
      },
      {
        name: /Perabot Rumah Tangga/i,
        maps: 'https://maps.google.com/maps?q=-7.5620,110.8320'
      },
      {
        name: /Tani Fresh/i,
        maps: 'https://maps.google.com/maps?q=-7.6000,110.8700'
      }
    ];

    for (const update of updates) {
      const result = await UMKM.updateMany(
        { nama_umkm: update.name },
        { maps: update.maps }
      );
      console.log(`Updated ${update.name}: ${result.modifiedCount} documents`);
    }

    console.log('All coordinates updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

updateCoordinates();
