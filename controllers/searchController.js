const { searchUMKM, indexAllUMKM, getSearchStats, isMeilisearchAvailable } = require('../services/searchService');
const UMKM = require('../models/Umkm');

// @desc    Search UMKM using Meilisearch with MongoDB fallback
// @route   GET /api/search
// @access  Public
exports.searchUMKMAdvanced = async (req, res) => {
  try {
    const { q, kategori, status, limit, page, sort } = req.query;

    // Pagination settings - default 10 per page
    const itemsPerPage = parseInt(limit) || 10;
    const currentPage = parseInt(page) || 1;
    const offset = (currentPage - 1) * itemsPerPage;

    // Build filters
    const filters = {};
    if (kategori && kategori !== 'Semua') filters.kategori = kategori;
    if (status) filters.status = status;
    filters.limit = itemsPerPage;
    filters.offset = offset;
    if (sort) filters.sort = sort;

    // Default to show only approved if no status specified
    if (!status) {
      filters.status = 'approved';
    }

    // Try Meilisearch first
    const result = await searchUMKM(q || '', filters);

    if (result.success) {
      const totalItems = result.estimatedTotalHits || result.hits.length;
      const totalPages = Math.ceil(totalItems / itemsPerPage);

      res.status(200).json({
        success: true,
        query: result.query,
        count: result.hits.length,
        data: result.hits,
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
    } else if (result.fallback) {
      // Fallback to MongoDB search
      console.log('⚠️ Meilisearch tidak tersedia, menggunakan MongoDB search');

      let mongoQuery = { status: filters.status || 'approved' };

      if (q && q.trim()) {
        // Case-insensitive regex search - hanya nama_umkm
        const searchRegex = new RegExp(q.trim(), 'i');
        mongoQuery.nama_umkm = searchRegex;
      }

      if (filters.kategori) {
        mongoQuery.kategori = filters.kategori;
      }

      // Get total count for pagination
      const totalItems = await UMKM.countDocuments(mongoQuery);
      const totalPages = Math.ceil(totalItems / itemsPerPage);

      const mongoResults = await UMKM.find(mongoQuery)
        .limit(itemsPerPage)
        .skip(offset)
        .sort({ views: -1 });

      res.status(200).json({
        success: true,
        query: q || '',
        count: mongoResults.length,
        data: mongoResults,
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
    } else {
      res.status(500).json({
        success: false,
        message: 'Pencarian gagal',
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat pencarian',
      error: error.message
    });
  }
};

// @desc    Reindex all UMKM to Meilisearch
// @route   POST /api/search/reindex
// @access  Private (Admin)
exports.reindexAllUMKM = async (req, res) => {
  try {
    const result = await indexAllUMKM();

    if (result.success) {
      res.status(200).json({
        success: true,
        message: `Berhasil mengindex ${result.count} UMKM`,
        taskUid: result.taskUid
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Gagal melakukan reindexing',
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat reindexing',
      error: error.message
    });
  }
};

// @desc    Get Meilisearch statistics
// @route   GET /api/search/stats
// @access  Private (Admin)
exports.getSearchStatistics = async (req, res) => {
  try {
    const result = await getSearchStats();

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.stats
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil statistik',
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil statistik',
      error: error.message
    });
  }
};

module.exports = {
  searchUMKMAdvanced: exports.searchUMKMAdvanced,
  reindexAllUMKM: exports.reindexAllUMKM,
  getSearchStatistics: exports.getSearchStatistics
};
