const UMKM = require('../models/Umkm');
const ActivityLog = require('../models/ActivityLog');
const { searchUMKM, indexUMKM, updateUMKMIndex, deleteUMKMIndex } = require('../services/searchService');
const https = require('https');

// Helper function to resolve Google Maps shortlinks and extract coordinates
const extractCoordinatesFromUrl = async (mapsUrl) => {
  if (!mapsUrl) return null;

  try {
    // First try direct extraction
    const patterns = [
      /@(-?\d+\.\d+),(-?\d+\.\d+)/, // @lat,lng format
      /q=(-?\d+\.\d+),(-?\d+\.\d+)/, // q=lat,lng format
      /ll=(-?\d+\.\d+),(-?\d+\.\d+)/, // ll=lat,lng format
    ];

    for (const pattern of patterns) {
      const match = mapsUrl.match(pattern);
      if (match) {
        const lat = parseFloat(match[1]);
        const lng = parseFloat(match[2]);
        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          return { latitude: lat, longitude: lng };
        }
      }
    }

    // If direct extraction failed and URL is a shortlink, resolve it
    if (mapsUrl.includes('goo.gl') || mapsUrl.includes('maps.app.goo.gl')) {
      const expandedUrl = await resolveUrl(mapsUrl);
      if (expandedUrl && expandedUrl !== mapsUrl) {
        // Try extract from expanded URL
        for (const pattern of patterns) {
          const match = expandedUrl.match(pattern);
          if (match) {
            const lat = parseFloat(match[1]);
            const lng = parseFloat(match[2]);
            if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
              return { latitude: lat, longitude: lng };
            }
          }
        }
      }
    }
  } catch (error) {
    console.warn('⚠️ Error extracting coordinates from URL:', error.message);
  }

  return null;
};

// Helper to resolve short URLs
const resolveUrl = (shortUrl) => {
  return new Promise((resolve) => {
    try {
      const timeout = setTimeout(() => resolve(shortUrl), 3000); // 3s timeout

      https.get(shortUrl, { maxRedirects: 10 }, (res) => {
        clearTimeout(timeout);
        resolve(res.url || res.headers.location || shortUrl);
      }).on('error', () => {
        clearTimeout(timeout);
        resolve(shortUrl);
      });
    } catch (error) {
      resolve(shortUrl);
    }
  });
};

// @desc    Get all UMKM
// @route   GET /api/umkm
// @access  Public
exports.getAllUMKM = async (req, res) => {
  try {
    const { status, kategori, search, page, limit } = req.query;

    // Pagination settings - default 10 per page
    const itemsPerPage = parseInt(limit) || 10;
    const currentPage = parseInt(page) || 1;
    const skip = (currentPage - 1) * itemsPerPage;

    // Use Meilisearch if there's a search query
    if (search && search.trim() !== '') {
      const filters = {
        limit: itemsPerPage,
        offset: skip
      };
      if (status) filters.status = status;
      if (kategori && kategori !== 'Semua') filters.kategori = kategori;

      const searchResult = await searchUMKM(search, filters);

      if (searchResult.success) {
        const totalItems = searchResult.estimatedTotalHits || searchResult.hits.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        return res.status(200).json({
          success: true,
          count: searchResult.hits.length,
          data: searchResult.hits,
          searchEngine: 'meilisearch',
          pagination: {
            currentPage: currentPage,
            itemsPerPage: itemsPerPage,
            totalItems: totalItems,
            totalPages: totalPages,
            hasNextPage: currentPage < totalPages,
            hasPrevPage: currentPage > 1
          }
        });
      }
      // Fallback to MongoDB if Meilisearch fails
      console.log('⚠️ Meilisearch failed, falling back to MongoDB');
    }

    // Use MongoDB for non-search queries or as fallback
    let query = {};

    if (status) query.status = status;
    if (kategori) query.kategori = kategori;
    if (search) {
      // Hanya search nama_umkm
      query.nama_umkm = { $regex: search, $options: 'i' };
    }

    // Get total count for pagination
    const totalItems = await UMKM.countDocuments(query);
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const umkmList = await UMKM.find(query)
      .populate('user_id', 'nama_user email_user')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(itemsPerPage);

    res.status(200).json({
      success: true,
      count: umkmList.length,
      data: umkmList,
      searchEngine: 'mongodb',
      pagination: {
        currentPage: currentPage,
        itemsPerPage: itemsPerPage,
        totalItems: totalItems,
        totalPages: totalPages,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data UMKM',
      error: error.message
    });
  }
};

// @desc    Get single UMKM
// @route   GET /api/umkm/:id
// @access  Public
exports.getUMKMById = async (req, res) => {
  try {
    const umkm = await UMKM.findById(req.params.id)
      .populate('user_id', 'nama_user email_user');

    if (!umkm) {
      return res.status(404).json({
        success: false,
        message: 'UMKM tidak ditemukan'
      });
    }

    res.status(200).json({
      success: true,
      data: umkm
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data UMKM',
      error: error.message
    });
  }
};

// @desc    Create UMKM
// @route   POST /api/umkm
// @access  Private (User/Admin)
exports.createUMKM = async (req, res) => {
  try {
    // Set user_id dan nama_user dari token
    if (req.user) {
      req.body.user_id = req.user._id;
      req.body.nama_user = req.user.nama_user;
    } else if (req.admin) {
      req.body.user_id = req.admin._id;
      req.body.nama_user = req.admin.nama_admin;
    }

    // Handle foto upload
    if (req.files && req.files.length > 0) {
      req.body.foto_umkm = req.files.map(file => `/uploads/${file.filename}`);
    }

    // Auto-extract lokasi from Google Maps URL if not already set
    if (req.body.maps && (!req.body.lokasi || !req.body.lokasi.latitude)) {
      const extractedCoords = await extractCoordinatesFromUrl(req.body.maps);
      if (extractedCoords) {
        req.body.lokasi = extractedCoords;
        console.log(`✅ Auto-extracted coordinates from maps URL for: ${req.body.nama_umkm}`);
      }
    }

    const umkm = await UMKM.create(req.body);

    // Auto-index to Meilisearch if status is approved
    if (umkm.status === 'approved') {
      await indexUMKM(umkm);
    }

    res.status(201).json({
      success: true,
      message: 'UMKM berhasil ditambahkan',
      data: umkm
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Gagal menambahkan UMKM',
      error: error.message
    });
  }
};

// @desc    Update UMKM
// @route   PUT /api/umkm/:id
// @access  Private (User/Admin)
exports.updateUMKM = async (req, res) => {
  try {
    let umkm = await UMKM.findById(req.params.id);

    if (!umkm) {
      return res.status(404).json({
        success: false,
        message: 'UMKM tidak ditemukan'
      });
    }

    // Handle foto upload
    if (req.files && req.files.length > 0) {
      req.body.foto_umkm = req.files.map(file => `/uploads/${file.filename}`);
    }

    // Auto-extract lokasi from Google Maps URL if maps changed
    if (req.body.maps && req.body.maps !== umkm.maps) {
      const extractedCoords = await extractCoordinatesFromUrl(req.body.maps);
      if (extractedCoords) {
        req.body.lokasi = extractedCoords;
        console.log(`✅ Auto-extracted coordinates from updated maps URL for: ${umkm.nama_umkm}`);
      }
    }

    umkm = await UMKM.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    // Update Meilisearch index if approved
    if (umkm.status === 'approved') {
      await updateUMKMIndex(umkm._id, umkm);
    } else {
      // Remove from index if not approved
      await deleteUMKMIndex(umkm._id);
    }

    res.status(200).json({
      success: true,
      message: 'UMKM berhasil diupdate',
      data: umkm
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Gagal mengupdate UMKM',
      error: error.message
    });
  }
};

// @desc    Delete UMKM
// @route   DELETE /api/umkm/:id
// @access  Private (User/Admin) - User can delete their own UMKM, Admin can delete any
exports.deleteUMKM = async (req, res) => {
  try {
    const umkm = await UMKM.findById(req.params.id);

    if (!umkm) {
      return res.status(404).json({
        success: false,
        message: 'UMKM tidak ditemukan'
      });
    }

    // Check authorization: User can only delete their own UMKM, Admin can delete any
    if (req.user) {
      // If user (not admin), check if they own this UMKM
      if (umkm.user_id.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Anda tidak memiliki izin untuk menghapus UMKM ini'
        });
      }
    }
    // If admin (req.admin exists), they can delete any UMKM

    await umkm.deleteOne();

    // Remove from Meilisearch index
    await deleteUMKMIndex(umkm._id);

    res.status(200).json({
      success: true,
      message: 'UMKM berhasil dihapus'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus UMKM',
      error: error.message
    });
  }
};

// @desc    Verify UMKM (Approve/Reject)
// @route   POST /api/umkm/:id/verify
// @access  Private (Admin)
exports.verifyUMKM = async (req, res) => {
  try {
    const { action, reason } = req.body;

    const umkm = await UMKM.findById(req.params.id);

    if (!umkm) {
      return res.status(404).json({
        success: false,
        message: 'UMKM tidak ditemukan'
      });
    }

    umkm.status = action === 'approve' ? 'approved' : 'rejected';

    // Simpan alasan penolakan jika ditolak
    if (action === 'reject' && reason) {
      umkm.alasan_penolakan = reason;
    } else if (action === 'approve') {
      umkm.alasan_penolakan = ''; // Clear alasan jika disetujui
    }

    await umkm.save();

    // Update Meilisearch index based on approval status
    if (action === 'approve') {
      await indexUMKM(umkm);
    } else {
      await deleteUMKMIndex(umkm._id);
    }

    // Buat activity log dengan informasi user pengirim
    await ActivityLog.create({
      admin_id: req.admin._id,
      admin_name: req.admin.nama_admin,
      umkm_id: umkm._id,
      umkm_nama: umkm.nama_umkm,
      user_id: umkm.user_id,
      user_name: umkm.nama_user || 'Unknown',
      action: action === 'approve' ? 'approved' : 'rejected',
      reason: reason || ''
    });

    res.status(200).json({
      success: true,
      message: `UMKM berhasil ${action === 'approve' ? 'disetujui' : 'ditolak'}`,
      data: umkm
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal memverifikasi UMKM',
      error: error.message
    });
  }
};

// @desc    Get UMKM statistics
// @route   GET /api/umkm/stats/overview
// @access  Private (Admin)
exports.getStatistics = async (req, res) => {
  try {
    const totalUMKM = await UMKM.countDocuments({ status: 'approved' });

    const umkmPerKategori = await UMKM.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: '$kategori', count: { $sum: 1 } } }
    ]);

    const kategoriMap = {
      'Kuliner': 0,
      'Fashion': 0,
      'Kerajinan': 0,
      'Jasa': 0,
      'Agribisnis & Pertanian': 0,
      'Toko Kelontong': 0
    };

    umkmPerKategori.forEach(item => {
      kategoriMap[item._id] = item.count;
    });

    res.status(200).json({
      success: true,
      data: {
        totalUMKM,
        umkmPerKategori: kategoriMap
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil statistik',
      error: error.message
    });
  }
};

// @desc    Get top UMKM by views
// @route   GET /api/umkm/top
// @access  Public
exports.getTopUMKM = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const topUMKM = await UMKM.find({ status: 'approved' })
      .sort({ views: -1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      count: topUMKM.length,
      data: topUMKM
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil top UMKM',
      error: error.message
    });
  }
};


// @desc    Increment UMKM view count
// @route   POST /api/umkm/:id/view
// @access  Public
exports.incrementView = async (req, res) => {
  try {
    const umkm = await UMKM.findById(req.params.id);

    if (!umkm) {
      return res.status(404).json({
        success: false,
        message: 'UMKM tidak ditemukan'
      });
    }

    // Increment views
    umkm.views += 1;
    await umkm.save();

    res.status(200).json({
      success: true,
      message: 'View count incremented',
      data: {
        views: umkm.views
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate view count',
      error: error.message
    });
  }
};