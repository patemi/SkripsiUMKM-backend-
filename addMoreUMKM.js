const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const UMKM = require('./models/Umkm');
const User = require('./models/User');

const addMoreUMKM = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/umkm_db');
    console.log('Connected to MongoDB');

    // Get first user for ownership
    const user = await User.findOne();
    if (!user) {
      console.error('No user found in database');
      process.exit(1);
    }

    const newUMKM = [
      {
        nama_umkm: 'Warung Nasi Pecel',
        deskripsi: 'Warung nasi pecel tradisional dengan cita rasa khas Jawa Timur',
        kategori: 'Kuliner',
        user_id: user._id,
        nomor_telepon: '081234567891',
        alamat: 'Jalan Ahmad Yani No. 45, Surakarta',
        maps: 'https://maps.google.com/maps?q=-7.5580,110.8290',
        jam_operasional: {
          senin: '06:00 - 22:00',
          selasa: '06:00 - 22:00',
          rabu: '06:00 - 22:00',
          kamis: '06:00 - 22:00',
          jumat: '06:00 - 22:00',
          sabtu: '06:00 - 22:00',
          minggu: '06:00 - 22:00'
        },
        foto_umkm: ['https://via.placeholder.com/300x200?text=Nasi+Pecel'],
        pembayaran: ['Tunai', 'QRIS'],
        status_verifikasi: 'approved',
        kontak: {
          telepon: '081234567891',
          whatsapp: '081234567891'
        }
      },
      {
        nama_umkm: 'Kopi Kenangan',
        deskripsi: 'Kedai kopi modern dengan berbagai pilihan kopi specialty',
        kategori: 'Kuliner',
        user_id: user._id,
        alamat: 'Jalan Slamet Riyadi No. 100, Surakarta',
        maps: 'https://maps.google.com/maps?q=-7.5590,110.8310',
        jam_operasional: {
          senin: '07:00 - 21:00',
          selasa: '07:00 - 21:00',
          rabu: '07:00 - 21:00',
          kamis: '07:00 - 21:00',
          jumat: '07:00 - 21:00',
          sabtu: '07:00 - 21:00',
          minggu: '07:00 - 21:00'
        },
        foto_umkm: ['https://via.placeholder.com/300x200?text=Kopi+Kenangan'],
        pembayaran: ['Tunai', 'QRIS', 'Debit'],
        status_verifikasi: 'approved',
        kontak: {
          telepon: '081234567892',
          instagram: '@kopi.kenangan'
        }
      },
      {
        nama_umkm: 'Bengkel Motor Jaya',
        deskripsi: 'Bengkel motor dengan layanan lengkap dan teknisi berpengalaman',
        kategori: 'Jasa',
        user_id: user._id,
        alamat: 'Jalan Gatot Subroto No. 75, Surakarta',
        maps: 'https://maps.google.com/maps?q=-7.5750,110.8450',
        jam_operasional: {
          senin: '08:00 - 18:00',
          selasa: '08:00 - 18:00',
          rabu: '08:00 - 18:00',
          kamis: '08:00 - 18:00',
          jumat: '08:00 - 18:00',
          sabtu: '08:00 - 18:00',
          minggu: 'Tutup'
        },
        foto_umkm: ['https://via.placeholder.com/300x200?text=Bengkel+Motor'],
        pembayaran: ['Tunai', 'Debit'],
        status_verifikasi: 'approved',
        kontak: {
          telepon: '081234567893',
          whatsapp: '081234567893'
        }
      }
    ];

    const result = await UMKM.insertMany(newUMKM);
    console.log(`Successfully added ${result.length} new UMKM:`);
    result.forEach(umkm => {
      console.log(`  - ${umkm.nama_umkm}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

addMoreUMKM();
