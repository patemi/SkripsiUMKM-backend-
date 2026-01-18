const mongoose = require('mongoose');
const Umkm = require('./models/Umkm');
const User = require('./models/User');
const { indexUMKM } = require('./services/searchService');
require('dotenv').config();

// Area Solo Raya dengan koordinat GPS
const soloRayaAreas = {
  surakarta: {
    kecamatan: ['Laweyan', 'Serengan', 'Pasar Kliwon', 'Jebres', 'Banjarsari'],
    coords: { lat: -7.5705, lng: 110.8283, radius: 0.05 }
  },
  boyolali: {
    kecamatan: ['Boyolali', 'Ampel', 'Mojosongo', 'Musuk', 'Nogosari', 'Sambi'],
    coords: { lat: -7.5305, lng: 110.5958, radius: 0.08 }
  },
  karanganyar: {
    kecamatan: ['Karanganyar', 'Jaten', 'Colomadu', 'Gondangrejo', 'Kebakkramat', 'Tasikmadu'],
    coords: { lat: -7.6039, lng: 110.9421, radius: 0.08 }
  },
  klaten: {
    kecamatan: ['Klaten Selatan', 'Klaten Utara', 'Klaten Tengah', 'Delanggu', 'Pedan', 'Trucuk'],
    coords: { lat: -7.7058, lng: 110.6065, radius: 0.08 }
  },
  sukoharjo: {
    kecamatan: ['Sukoharjo', 'Kartasura', 'Grogol', 'Bendosari', 'Polokarto', 'Mojolaban'],
    coords: { lat: -7.6813, lng: 110.8407, radius: 0.08 }
  },
  wonogiri: {
    kecamatan: ['Wonogiri', 'Ngadirojo', 'Selogiri', 'Jatiroto', 'Giritontro'],
    coords: { lat: -7.8145, lng: 110.9264, radius: 0.1 }
  },
  sragen: {
    kecamatan: ['Sragen', 'Masaran', 'Kedawung', 'Gondang', 'Gemolong'],
    coords: { lat: -7.4256, lng: 111.0217, radius: 0.08 }
  }
};

// Template nama UMKM khas Solo Raya
const namaTemplates = {
  kuliner: [
    'Warung Makan {owner}', 'Soto {area}', 'Nasi Liwet {owner}', 
    'Gudeg {area}', 'Tengkleng {owner}', 'Selat Solo {area}',
    'Intip Goreng {owner}', 'Serabi {area}', 'Timlo {owner}',
    'Cabuk Rambak {area}', 'Sate Buntel {owner}', 'Wedang Ronde {area}'
  ],
  fashion: [
    'Batik {area}', 'Konveksi {owner}', 'Butik {owner}',
    'Batik Cap {area}', 'Lurik {owner}', 'Fashion {area}',
    'Batik Tulis {owner}', 'Tenun {area}', 'Busana {owner}'
  ],
  kerajinan: [
    'Kerajinan {owner}', 'Anyaman {area}', 'Gerabah {area}',
    'Ukiran Kayu {owner}', 'Keris {area}', 'Wayang Kulit {owner}',
    'Kerajinan Bambu {area}', 'Sangkar Burung {owner}', 'Gamelan {area}'
  ],
  jasa: [
    'Salon {owner}', 'Pangkas Rambut {area}', 'Laundry {owner}',
    'Service Motor {area}', 'Fotocopy {owner}', 'Jahit {area}',
    'Bengkel {owner}', 'Cuci Motor {area}', 'Kursus {owner}'
  ],
  agribisnis: [
    'Tani {area}', 'Kebun {owner}', 'Ternak {area}',
    'Sayur {owner}', 'Buah {area}', 'Bibit {owner}',
    'Organik {area}', 'Hidroponik {owner}', 'Tanaman Hias {area}'
  ],
  toko: [
    'Toko {owner}', 'Warung {area}', 'Minimarket {owner}',
    'Sembako {area}', 'Kelontong {owner}', 'Retail {area}'
  ]
};

// Deskripsi khas Solo Raya
const deskripsiTemplates = {
  kuliner: [
    'Menyajikan masakan khas Solo dengan cita rasa tradisional yang autentik',
    'Kuliner tradisional Solo dengan resep turun temurun',
    'Makanan khas Solo yang enak dan terjangkau',
    'Sajian kuliner tradisional dengan bumbu racikan khas Solo',
    'Warung makan dengan menu khas Solo yang lezat'
  ],
  fashion: [
    'Batik khas Solo dengan motif tradisional dan modern',
    'Menjual batik tulis dan cap berkualitas tinggi',
    'Produk fashion batik dengan desain kekinian',
    'Batik Solo asli dengan harga terjangkau',
    'Fashion batik dan lurik khas Solo Raya'
  ],
  kerajinan: [
    'Kerajinan tangan khas Solo dengan kualitas terbaik',
    'Produk kerajinan tradisional Solo yang unik',
    'Kerajinan asli buatan pengrajin lokal Solo',
    'Seni kerajinan tradisional dengan sentuhan modern',
    'Kerajinan khas Solo dengan harga bersahabat'
  ],
  jasa: [
    'Pelayanan jasa profesional dan terpercaya',
    'Jasa berkualitas dengan harga terjangkau',
    'Melayani dengan cepat dan ramah',
    'Jasa terbaik di wilayah Solo Raya',
    'Layanan profesional untuk kebutuhan Anda'
  ],
  agribisnis: [
    'Produk pertanian segar dari petani lokal',
    'Hasil pertanian berkualitas tinggi',
    'Produk agribisnis organik dan sehat',
    'Komoditas pertanian pilihan dari Solo Raya',
    'Produk pertanian lokal dengan harga petani'
  ],
  toko: [
    'Menyediakan kebutuhan sehari-hari lengkap',
    'Toko dengan harga terjangkau dan pelayanan ramah',
    'Belanja kebutuhan pokok dengan mudah',
    'Toko kelontong terlengkap di daerah',
    'Menjual berbagai kebutuhan rumah tangga'
  ]
};

// Nama pemilik khas Jawa
const namaOwners = [
  'Pak Budi', 'Bu Siti', 'Pak Joko', 'Bu Sri', 'Pak Agus',
  'Bu Nur', 'Pak Bambang', 'Bu Ani', 'Pak Eko', 'Bu Endang',
  'Pak Hadi', 'Bu Ratna', 'Pak Imam', 'Bu Umi', 'Pak Dwi',
  'Bu Yuni', 'Pak Tri', 'Bu Lestari', 'Pak Rudi', 'Bu Titik',
  'Pak Sarno', 'Bu Sumirah', 'Pak Surya', 'Bu Wati', 'Pak Adi'
];

// Nama jalan umum di Solo Raya
const namaJalan = [
  'Jl. Slamet Riyadi', 'Jl. Veteran', 'Jl. Brigjen Slamet Riyadi',
  'Jl. Yos Sudarso', 'Jl. Dr. Radjiman', 'Jl. Honggowongso',
  'Jl. Ir. Sutami', 'Jl. Dr. Moewardi', 'Jl. Adi Sucipto',
  'Jl. MT Haryono', 'Jl. Gatot Subroto', 'Jl. Ahmad Yani',
  'Jl. Diponegoro', 'Jl. Sudirman', 'Jl. Monginsidi',
  'Jl. Ronggowarsito', 'Jl. Ki Hajar Dewantara', 'Jl. Kartini'
];

// Generate random koordinat dalam radius
function generateRandomCoords(baseCoords, radius) {
  const lat = baseCoords.lat + (Math.random() - 0.5) * radius * 2;
  const lng = baseCoords.lng + (Math.random() - 0.5) * radius * 2;
  return {
    latitude: parseFloat(lat.toFixed(6)),
    longitude: parseFloat(lng.toFixed(6))
  };
}

// Generate jam operasional
function generateJamOperasional() {
  const openHours = ['07:00', '08:00', '09:00', '10:00'];
  const closeHours = ['17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];
  const open = openHours[Math.floor(Math.random() * openHours.length)];
  const close = closeHours[Math.floor(Math.random() * closeHours.length)];
  
  return {
    senin: `${open} - ${close}`,
    selasa: `${open} - ${close}`,
    rabu: `${open} - ${close}`,
    kamis: `${open} - ${close}`,
    jumat: `${open} - ${close}`,
    sabtu: `${open} - ${close}`,
    minggu: Math.random() > 0.3 ? `${open} - ${close}` : 'Tutup'
  };
}

// Generate nomor telepon Indonesia
function generatePhoneNumber() {
  const prefixes = ['0812', '0813', '0821', '0822', '0852', '0853', '0856', '0857'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const number = Math.floor(10000000 + Math.random() * 90000000);
  return `${prefix}-${number}`;
}

async function seedSoloRaya100() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/umkm_db');
    console.log('✅ MongoDB Connected');

    // Get or create dummy user
    let dummyUser = await User.findOne({ email_user: 'dummy@soloraya.com' });
    if (!dummyUser) {
      dummyUser = await User.create({
        nama_user: 'Dummy User Solo Raya',
        email_user: 'dummy@soloraya.com',
        username: 'dummysoloraya',
        password_user: 'dummy123456'
      });
      console.log(`✅ Created dummy user: ${dummyUser._id}`);
    } else {
      console.log(`✅ Using existing dummy user: ${dummyUser._id}`);
    }

    // Kategori distribution
    const categories = [
      { name: 'Kuliner', count: 25 },
      { name: 'Fashion', count: 20 },
      { name: 'Kerajinan', count: 18 },
      { name: 'Jasa', count: 15 },
      { name: 'Agribisnis & Pertanian', count: 12 },
      { name: 'Toko Kelontong', count: 10 }
    ];

    const umkmData = [];
    const areaKeys = Object.keys(soloRayaAreas);

    console.log('\n🏭 Generating 100 UMKM data untuk Solo Raya...');

    for (const category of categories) {
      const categoryKey = category.name.toLowerCase().split(' ')[0];
      
      for (let i = 0; i < category.count; i++) {
        // Random area di Solo Raya
        const areaKey = areaKeys[Math.floor(Math.random() * areaKeys.length)];
        const area = soloRayaAreas[areaKey];
        const areaName = areaKey.charAt(0).toUpperCase() + areaKey.slice(1);
        const kecamatan = area.kecamatan[Math.floor(Math.random() * area.kecamatan.length)];
        
        // Generate nama UMKM
        const owner = namaOwners[Math.floor(Math.random() * namaOwners.length)];
        const nameTemplate = namaTemplates[categoryKey][Math.floor(Math.random() * namaTemplates[categoryKey].length)];
        const namaUmkm = nameTemplate
          .replace('{owner}', owner)
          .replace('{area}', areaName);
        
        // Generate alamat
        const jalan = namaJalan[Math.floor(Math.random() * namaJalan.length)];
        const nomorJalan = Math.floor(Math.random() * 200) + 1;
        const alamat = `${jalan} No. ${nomorJalan}, ${kecamatan}, ${areaName}`;
        
        // Generate koordinat
        const lokasi = generateRandomCoords(area.coords, area.coords.radius);
        
        // Generate deskripsi
        const deskripsi = deskripsiTemplates[categoryKey][Math.floor(Math.random() * deskripsiTemplates[categoryKey].length)];
        
        // Generate Instagram handle
        const instagramHandle = namaUmkm.toLowerCase()
          .replace(/\s+/g, '')
          .replace(/[^a-z0-9]/g, '')
          .substring(0, 20);
        
        umkmData.push({
          nama_umkm: namaUmkm,
          deskripsi: deskripsi,
          kategori: category.name,
          alamat: alamat,
          jam_operasional: generateJamOperasional(),
          no_telepon: generatePhoneNumber(),
          instagram: `@${instagramHandle}`,
          foto_umkm: [],
          status: 'approved',
          user_id: dummyUser._id,
          nama_user: owner,
          lokasi: lokasi
        });
      }
    }

    console.log(`✅ Generated ${umkmData.length} UMKM data`);

    // Insert ke database
    const result = await Umkm.insertMany(umkmData);
    console.log(`✅ Inserted ${result.length} UMKM to database`);

    // Index ke Meilisearch
    try {
      const allUmkm = await Umkm.find({ status: 'approved' }).lean();
      
      // Prepare documents untuk Meilisearch
      const documents = allUmkm.map(umkm => ({
        _id: umkm._id.toString(),
        nama_umkm: umkm.nama_umkm,
        deskripsi: umkm.deskripsi,
        kategori: umkm.kategori,
        alamat: umkm.alamat,
        jam_operasional: umkm.jam_operasional,
        no_telepon: umkm.no_telepon,
        instagram: umkm.instagram,
        foto_umkm: umkm.foto_umkm || [],
        status: umkm.status,
        user_id: umkm.user_id.toString(),
        nama_user: umkm.nama_user,
        lokasi: umkm.lokasi,
        createdAt: umkm.createdAt
      }));

      const { meilisearchClient, UMKM_INDEX } = require('./config/meilisearch');
      const index = meilisearchClient.index(UMKM_INDEX);
      const indexResult = await index.addDocuments(documents);
      
      console.log(`✅ Indexed ${documents.length} UMKM documents (Task UID: ${indexResult.taskUid})`);
    } catch (meilisearchError) {
      console.log('⚠️  Meilisearch indexing skipped (server might not be running)');
    }

    // Tampilkan ringkasan per kategori
    console.log('\n📊 Distribusi per Kategori:');
    for (const category of categories) {
      console.log(`   - ${category.name}: ${category.count} UMKM`);
    }

    // Tampilkan ringkasan per area
    console.log('\n📍 Distribusi per Area:');
    const areaCount = {};
    for (const umkm of umkmData) {
      const area = umkm.alamat.split(', ')[2];
      areaCount[area] = (areaCount[area] || 0) + 1;
    }
    Object.entries(areaCount).forEach(([area, count]) => {
      console.log(`   - ${area}: ${count} UMKM`);
    });

    console.log('\n✅ Seeding completed successfully!');
    console.log('🎉 100 UMKM Solo Raya telah ditambahkan ke database!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seedSoloRaya100();
