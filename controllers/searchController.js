const { searchUMKM, indexAllUMKM, getSearchStats } = require('../services/searchService');
const { getAISearchSuggestion } = require('../services/aiSearchService');
const UMKM = require('../models/Umkm');

const normalizeQueryText = (value) => String(value || '').trim();

const isDifferentQuery = (left, right) => normalizeQueryText(left).toLowerCase() !== normalizeQueryText(right).toLowerCase();

const buildMongoQuery = (queryText, filters) => {
  const mongoQuery = { status: filters.status || 'approved' };

  if (queryText) {
    const searchRegex = new RegExp(queryText, 'i');
    mongoQuery.$or = [
      { nama_umkm: searchRegex },
      { deskripsi: searchRegex },
      { alamat: searchRegex }
    ];
  }

  if (filters.kategori) {
    mongoQuery.kategori = filters.kategori;
  }

  return mongoQuery;
};

const runMongoSearch = async ({ queryText, filters, itemsPerPage, offset }) => {
  const mongoQuery = buildMongoQuery(queryText, filters);

  const totalItems = await UMKM.countDocuments(mongoQuery);
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const hits = await UMKM.find(mongoQuery)
    .limit(itemsPerPage)
    .skip(offset)
    .sort({ views: -1, createdAt: -1 });

  return {
    engine: 'mongodb',
    hits,
    totalItems,
    totalPages,
    totalHits: totalItems
  };
};

const runHybridSearch = async ({ queryText, filters, itemsPerPage, offset }) => {
  const meiliResult = await searchUMKM(queryText || '', filters);

  if (meiliResult.success) {
    const totalItems = meiliResult.estimatedTotalHits || meiliResult.hits.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    return {
      engine: 'meilisearch',
      hits: meiliResult.hits,
      totalItems,
      totalPages,
      totalHits: totalItems,
      processingTimeMs: meiliResult.processingTimeMs
    };
  }

  if (meiliResult.fallback) {
    console.log('Meilisearch tidak tersedia, menggunakan MongoDB search');
    return runMongoSearch({ queryText, filters, itemsPerPage, offset });
  }

  throw new Error(meiliResult.error || 'Pencarian gagal');
};

// @desc    Search UMKM using Meilisearch with MongoDB fallback
// @route   GET /api/search
// @access  Public
exports.searchUMKMAdvanced = async (req, res) => {
  try {
    const { q, kategori, status, limit, page, sort } = req.query;
    const rawQuery = normalizeQueryText(q);

    // Pagination settings - default 10 per page
    const itemsPerPage = Math.min(parseInt(limit, 10) || 10, 50);
    const currentPage = parseInt(page, 10) || 1;
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

    const primarySearch = await runHybridSearch({
      queryText: rawQuery,
      filters,
      itemsPerPage,
      offset
    });

    let finalSearch = primarySearch;
    let aiSearch = null;
    let usedCorrectedQuery = false;

    const shouldUseAi = rawQuery.length >= 2 && primarySearch.hits.length <= 3;
    if (shouldUseAi) {
      aiSearch = await getAISearchSuggestion(rawQuery, { limit: 5 });

      if (aiSearch.didYouMean && isDifferentQuery(aiSearch.didYouMean, rawQuery)) {
        const correctedSearch = await runHybridSearch({
          queryText: aiSearch.didYouMean,
          filters,
          itemsPerPage,
          offset
        });

        if (primarySearch.hits.length === 0 && correctedSearch.hits.length > 0) {
          finalSearch = correctedSearch;
          usedCorrectedQuery = true;
        }
      }
    }

    const pagination = {
      currentPage,
      itemsPerPage,
      totalItems: finalSearch.totalItems,
      totalPages: finalSearch.totalPages,
      hasNextPage: currentPage < finalSearch.totalPages,
      hasPrevPage: currentPage > 1
    };

    return res.status(200).json({
      success: true,
      query: usedCorrectedQuery ? aiSearch.didYouMean : rawQuery,
      originalQuery: usedCorrectedQuery ? rawQuery : undefined,
      correctedQueryUsed: usedCorrectedQuery,
      count: finalSearch.hits.length,
      data: finalSearch.hits,
      searchEngine: usedCorrectedQuery
        ? `${finalSearch.engine}+groq`
        : finalSearch.engine,
      pagination,
      aiSearch: aiSearch
        ? {
            enabled: aiSearch.enabled,
            provider: aiSearch.provider,
            model: aiSearch.model,
            didYouMean: aiSearch.didYouMean,
            suggestions: aiSearch.suggestions,
            reason: aiSearch.reason,
            usedCorrectedQuery
          }
        : {
            enabled: false,
            suggestions: []
          }
    });
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

// @desc    Get AI suggestions for search keyword
// @route   GET /api/search/suggest
// @access  Public
exports.getAISearchSuggestions = async (req, res) => {
  try {
    const query = normalizeQueryText(req.query.q);
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Parameter q wajib diisi'
      });
    }

    const limit = Math.min(parseInt(req.query.limit, 10) || 5, 10);
    const aiSuggestion = await getAISearchSuggestion(query, { limit });

    return res.status(200).json({
      success: true,
      query,
      enabled: aiSuggestion.enabled,
      provider: aiSuggestion.provider,
      model: aiSuggestion.model,
      didYouMean: aiSuggestion.didYouMean,
      suggestions: aiSuggestion.suggestions,
      reason: aiSuggestion.reason
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil saran pencarian AI',
      error: error.message
    });
  }
};

module.exports = {
  searchUMKMAdvanced: exports.searchUMKMAdvanced,
  reindexAllUMKM: exports.reindexAllUMKM,
  getSearchStatistics: exports.getSearchStatistics,
  getAISearchSuggestions: exports.getAISearchSuggestions
};
