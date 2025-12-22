require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/database');
const Admin = require('./models/Admin');
const User = require('./models/User');
const UMKM = require('./models/Umkm');

// Data untuk seeding
const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    console.log('Menghapus data lama...');
    await Admin.deleteMany();
    await User.deleteMany();
    await UMKM.deleteMany();

    // Create Admin
    console.log('Membuat admin...');
    const admin = await Admin.create({
      nama_admin: 'Admin Utama',
      username_admin: 'admin',
      password_admin: 'admin123',
      role: 'superadmin'
    });
    console.log('✓ Admin berhasil dibuat');

    // Create Users
    console.log('Membuat users...');
    const user1 = await User.create({
      nama_user: 'Budi Santoso',
      email_user: 'budi@example.com',
      username: 'budi',
      password_user: 'user1234'
    });

    const user2 = await User.create({
      nama_user: 'Siti Nurhaliza',
      email_user: 'siti@example.com',
      username: 'siti',
      password_user: 'user1234'
    });
    console.log('✓ Users berhasil dibuat');

    // Create UMKM
    console.log('Membuat UMKM...');
    await UMKM.create([
      {
        nama_umkm: 'Warung Makan Bu Siti',
        foto_umkm: [],
        kategori: 'Kuliner',
        deskripsi: 'Warung makan dengan menu masakan rumahan yang lezat dan harga terjangkau. Menyediakan berbagai menu nasi campur, soto, dan masakan tradisional.',
        pembayaran: ['Tunai', 'QRIS'],
        alamat: 'Jl. Merdeka No. 123, Jakarta Pusat',
        maps: 'https://maps.google.com',
        jam_operasional: {
          senin: '08:00 - 20:00',
          selasa: '08:00 - 20:00',
          rabu: '08:00 - 20:00',
          kamis: '08:00 - 20:00',
          jumat: '08:00 - 20:00',
          sabtu: '08:00 - 20:00',
          minggu: 'Tutup'
        },
        kontak: {
          telepon: '081234567890',
          whatsapp: '081234567890',
          email: 'warungbusiti@email.com',
          instagram: '@warungbusiti',
          facebook: 'Warung Bu Siti'
        },
        status: 'approved',
        views: 156,
        user_id: user1._id
      },
      {
        nama_umkm: 'Batik Nusantara',
        foto_umkm: [],
        kategori: 'Fashion',
        deskripsi: 'Menjual berbagai macam batik asli Indonesia dengan motif modern dan tradisional. Tersedia batik tulis dan cap dengan kualitas premium.',
        pembayaran: ['Tunai', 'Debit', 'QRIS'],
        alamat: 'Jl. Sudirman No. 456, Yogyakarta',
        maps: 'https://maps.google.com',
        jam_operasional: {
          senin: '09:00 - 18:00',
          selasa: '09:00 - 18:00',
          rabu: '09:00 - 18:00',
          kamis: '09:00 - 18:00',
          jumat: '09:00 - 18:00',
          sabtu: '09:00 - 18:00',
          minggu: '10:00 - 16:00'
        },
        kontak: {
          telepon: '081234567891',
          whatsapp: '081234567891',
          email: 'batik.nusantara@email.com',
          instagram: '@batiknusantara',
          facebook: 'Batik Nusantara'
        },
        status: 'approved',
        views: 128,
        user_id: user2._id
      },
      {
        nama_umkm: 'Kerajinan Bambu Kreatif',
        foto_umkm: [],
        kategori: 'Kerajinan',
        deskripsi: 'Produk kerajinan tangan dari bambu berkualitas tinggi. Menyediakan berbagai produk seperti keranjang, lampu hias, dan furniture bambu.',
        pembayaran: ['Tunai', 'QRIS'],
        alamat: 'Jl. Diponegoro No. 789, Bandung',
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
          telepon: '081234567892',
          whatsapp: '081234567892',
          email: 'bambukreatif@email.com',
          instagram: '@bambukreatif',
          facebook: 'Kerajinan Bambu Kreatif'
        },
        status: 'approved',
        views: 89,
        user_id: user1._id
      },
      {
        nama_umkm: 'Laundry Express',
        foto_umkm: [],
        kategori: 'Jasa',
        deskripsi: 'Layanan laundry kiloan dan satuan dengan harga terjangkau. Proses cepat, bersih, dan wangi. Melayani antar jemput gratis.',
        pembayaran: ['Tunai', 'Debit'],
        alamat: 'Jl. Gatot Subroto No. 321, Surabaya',
        maps: 'https://maps.google.com',
        jam_operasional: {
          senin: '07:00 - 21:00',
          selasa: '07:00 - 21:00',
          rabu: '07:00 - 21:00',
          kamis: '07:00 - 21:00',
          jumat: '07:00 - 21:00',
          sabtu: '07:00 - 21:00',
          minggu: '08:00 - 20:00'
        },
        kontak: {
          telepon: '081234567893',
          whatsapp: '081234567893',
          email: 'laundryexpress@email.com',
          instagram: '@laundryexpress',
          facebook: 'Laundry Express'
        },
        status: 'pending',
        views: 45,
        user_id: user2._id
      },
      {
        nama_umkm: 'Tani Fresh',
        foto_umkm: [],
        kategori: 'Agribisnis & Pertanian',
        deskripsi: 'Menyediakan sayuran segar dan organik langsung dari petani. Produk berkualitas tinggi tanpa pestisida berbahaya.',
        pembayaran: ['Tunai', 'QRIS'],
        alamat: 'Jl. Raya Bogor Km 25, Bogor',
        maps: 'https://maps.google.com',
        jam_operasional: {
          senin: '06:00 - 18:00',
          selasa: '06:00 - 18:00',
          rabu: '06:00 - 18:00',
          kamis: '06:00 - 18:00',
          jumat: '06:00 - 18:00',
          sabtu: '06:00 - 18:00',
          minggu: '06:00 - 12:00'
        },
        kontak: {
          telepon: '081234567894',
          whatsapp: '081234567894',
          email: 'tanifresh@email.com',
          instagram: '@tanifresh',
          facebook: 'Tani Fresh'
        },
        status: 'pending',
        views: 67,
        user_id: user1._id
      }
    ]);
    console.log('✓ UMKM berhasil dibuat');

    console.log('\n=================================');
    console.log('Seeding berhasil!');
    console.log('=================================');
    console.log('\nData Login:');
    console.log('Admin:');
    console.log('  Username: admin');
    console.log('  Password: admin123');
    console.log('\nUser 1:');
    console.log('  Username: budi');
    console.log('  Password: user123');
    console.log('\nUser 2:');
    console.log('  Username: siti');
    console.log('  Password: user123');
    console.log('=================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
