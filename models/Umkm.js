const mongoose = require('mongoose');

const umkmSchema = new mongoose.Schema({
  nama_umkm: {
    type: String,
    required: [true, 'Nama UMKM harus diisi'],
    trim: true
  },
  foto_umkm: [{
    type: String,
    default: []
  }],
  kategori: {
    type: String,
    required: [true, 'Kategori harus dipilih'],
    enum: ['Kuliner', 'Fashion', 'Kerajinan', 'Jasa', 'Agribisnis & Pertanian', 'Toko Kelontong']
  },
  deskripsi: {
    type: String,
    required: [true, 'Deskripsi harus diisi'],
    trim: true
  },
  pembayaran: [{
    type: String,
    enum: ['Tunai', 'QRIS', 'Debit']
  }],
  alamat: {
    type: String,
    required: [true, 'Alamat harus diisi'],
    trim: true
  },
  maps: {
    type: String,
    trim: true
  },
  lokasi: {
    latitude: { type: Number },
    longitude: { type: Number }
  },
  jam_operasional: {
    senin: { type: String, default: '' },
    selasa: { type: String, default: '' },
    rabu: { type: String, default: '' },
    kamis: { type: String, default: '' },
    jumat: { type: String, default: '' },
    sabtu: { type: String, default: '' },
    minggu: { type: String, default: '' }
  },
  kontak: {
    telepon: { type: String, default: '' },
    whatsapp: { type: String, default: '' },
    email: { type: String, default: '' },
    instagram: { type: String, default: '' },
    facebook: { type: String, default: '' }
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  alasan_penolakan: {
    type: String,
    default: ''
  },
  views: {
    type: Number,
    default: 0
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  nama_user: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index untuk pencarian
umkmSchema.index({ nama_umkm: 'text', deskripsi: 'text' });
umkmSchema.index({ kategori: 1 });
umkmSchema.index({ status: 1 });

module.exports = mongoose.model('UMKM', umkmSchema);
