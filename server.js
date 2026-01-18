require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/database');
const { initializeMeilisearch } = require('./config/meilisearch');
const { apiLimiter } = require('./middleware/rateLimit');

// Import routes
const umkmRoutes = require('./routes/umkmRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const activityLogRoutes = require('./routes/activityLogRoutes');
const growthRoutes = require('./routes/growthRoutes');
const searchRoutes = require('./routes/searchRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const exportRoutes = require('./routes/exportRoutes');
const mapsRoutes = require('./routes/mapsRoutes');
const { indexAllUMKM } = require('./services/searchService');

// Connect to database
connectDB();

// Initialize Meilisearch and reindex data
initializeMeilisearch().then(async (success) => {
  if (success) {
    console.log('🔄 Menjalankan reindex data UMKM ke Meilisearch...');
    try {
      const result = await indexAllUMKM();
      if (result.success) {
        console.log(`✅ Berhasil reindex ${result.count} UMKM ke Meilisearch`);
      } else {
        console.log('⚠️ Gagal reindex:', result.error);
      }
    } catch (err) {
      console.log('⚠️ Error saat reindex:', err.message);
    }
  }
}).catch(err => {
  console.error('Failed to initialize Meilisearch:', err);
  console.log('⚠️ Application will continue without Meilisearch search optimization');
});

const app = express();

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // Allow image loading from different origins
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true // Enable cookies
}));
app.use(cookieParser());

// Rate limiting untuk semua API routes
app.use('/api/', apiLimiter);

// Tingkatkan limit untuk upload gambar base64 (50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/umkm', umkmRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/growth', growthRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/maps', mapsRoutes);
app.use('/api/search', searchRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API UMKM Management System',
    version: '1.0.0',
    searchEngine: 'Meilisearch (optimized)',
    endpoints: {
      umkm: '/api/umkm',
      admin: '/api/admin',
      user: '/api/user',
      activityLogs: '/api/activity-logs',
      search: '/api/search'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route tidak ditemukan'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
