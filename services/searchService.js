const { meilisearchClient, UMKM_INDEX, checkMeilisearchConnection } = require('../config/meilisearch');
const UMKM = require('../models/Umkm');

/**
 * Check if Meilisearch is available
 */
const isMeilisearchAvailable = async () => {
  try {
    await meilisearchClient.health();
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Index a single UMKM document in Meilisearch
 */
const indexUMKM = async (umkmData) => {
  try {
    const isAvailable = await isMeilisearchAvailable();
    if (!isAvailable) {
      console.log('⚠️ Meilisearch tidak tersedia, skip indexing');
      return false;
    }

    const index = meilisearchClient.index(UMKM_INDEX);

    // Prepare document for Meilisearch
    const document = {
      id: umkmData._id.toString(),
      _id: umkmData._id.toString(),
      nama_umkm: umkmData.nama_umkm,
      deskripsi: umkmData.deskripsi || '',
      kategori: umkmData.kategori,
      alamat: umkmData.alamat || '',
      kecamatan: umkmData.kecamatan || '',
      jam_operasional: umkmData.jam_operasional || {},
      nomor_telepon: umkmData.nomor_telepon || '',
      whatsapp: umkmData.whatsapp || '',
      instagram: umkmData.instagram || '',
      foto_umkm: umkmData.foto_umkm || [],
      status: umkmData.status,
      user_id: umkmData.user_id ? umkmData.user_id.toString() : '',
      nama_user: umkmData.nama_user || '',
      lokasi: umkmData.lokasi || {},
      maps: umkmData.maps || '',
      pembayaran: umkmData.pembayaran || [],
      views: umkmData.views || 0,
      createdAt: umkmData.createdAt ? new Date(umkmData.createdAt).getTime() : Date.now(),
      updatedAt: umkmData.updatedAt ? new Date(umkmData.updatedAt).getTime() : Date.now()
    };

    await index.addDocuments([document], { primaryKey: 'id' });
    console.log(`✅ Indexed UMKM: ${umkmData.nama_umkm}`);
    return true;
  } catch (error) {
    console.error('❌ Error indexing UMKM:', error.message);
    return false;
  }
};

/**
 * Index multiple UMKM documents in batch
 */
const indexAllUMKM = async () => {
  try {
    const isAvailable = await isMeilisearchAvailable();
    if (!isAvailable) {
      console.log('⚠️ Meilisearch tidak tersedia, skip batch indexing');
      return { success: false, error: 'Meilisearch tidak tersedia' };
    }

    const index = meilisearchClient.index(UMKM_INDEX);

    // Get all approved UMKM from MongoDB
    const umkmList = await UMKM.find({ status: 'approved' });

    // Prepare documents for Meilisearch
    const documents = umkmList.map(umkm => ({
      id: umkm._id.toString(),
      _id: umkm._id.toString(),
      nama_umkm: umkm.nama_umkm,
      deskripsi: umkm.deskripsi || '',
      kategori: umkm.kategori,
      alamat: umkm.alamat || '',
      kecamatan: umkm.kecamatan || '',
      jam_operasional: umkm.jam_operasional || {},
      nomor_telepon: umkm.nomor_telepon || '',
      whatsapp: umkm.whatsapp || '',
      instagram: umkm.instagram || '',
      foto_umkm: umkm.foto_umkm || [],
      status: umkm.status,
      user_id: umkm.user_id ? umkm.user_id.toString() : '',
      nama_user: umkm.nama_user || '',
      lokasi: umkm.lokasi || {},
      maps: umkm.maps || '',
      pembayaran: umkm.pembayaran || [],
      views: umkm.views || 0,
      createdAt: umkm.createdAt ? new Date(umkm.createdAt).getTime() : Date.now(),
      updatedAt: umkm.updatedAt ? new Date(umkm.updatedAt).getTime() : Date.now()
    }));

    // Add documents to Meilisearch in batch
    const task = await index.addDocuments(documents, { primaryKey: 'id' });

    console.log(`✅ Indexed ${documents.length} UMKM documents`);
    console.log(`Task UID: ${task.taskUid}`);

    return { success: true, count: documents.length, taskUid: task.taskUid };
  } catch (error) {
    console.error('❌ Error indexing all UMKM:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Update an UMKM document in Meilisearch
 */
const updateUMKMIndex = async (umkmId, umkmData) => {
  try {
    const isAvailable = await isMeilisearchAvailable();
    if (!isAvailable) return false;

    const index = meilisearchClient.index(UMKM_INDEX);

    const document = {
      id: umkmId.toString(),
      _id: umkmId.toString(),
      nama_umkm: umkmData.nama_umkm,
      deskripsi: umkmData.deskripsi || '',
      kategori: umkmData.kategori,
      alamat: umkmData.alamat || '',
      kecamatan: umkmData.kecamatan || '',
      jam_operasional: umkmData.jam_operasional || {},
      nomor_telepon: umkmData.nomor_telepon || '',
      whatsapp: umkmData.whatsapp || '',
      instagram: umkmData.instagram || '',
      foto_umkm: umkmData.foto_umkm || [],
      status: umkmData.status,
      user_id: umkmData.user_id ? umkmData.user_id.toString() : '',
      nama_user: umkmData.nama_user || '',
      lokasi: umkmData.lokasi || {},
      maps: umkmData.maps || '',
      pembayaran: umkmData.pembayaran || [],
      views: umkmData.views || 0,
      createdAt: umkmData.createdAt ? new Date(umkmData.createdAt).getTime() : Date.now(),
      updatedAt: Date.now()
    };

    await index.updateDocuments([document], { primaryKey: 'id' });
    console.log(`✅ Updated UMKM index: ${umkmData.nama_umkm}`);
    return true;
  } catch (error) {
    console.error('❌ Error updating UMKM index:', error.message);
    return false;
  }
};

/**
 * Delete an UMKM document from Meilisearch
 */
const deleteUMKMIndex = async (umkmId) => {
  try {
    const isAvailable = await isMeilisearchAvailable();
    if (!isAvailable) return false;

    const index = meilisearchClient.index(UMKM_INDEX);
    await index.deleteDocument(umkmId.toString());
    console.log(`✅ Deleted UMKM from index: ${umkmId}`);
    return true;
  } catch (error) {
    console.error('❌ Error deleting UMKM from index:', error.message);
    return false;
  }
};

/**
 * Search UMKM using Meilisearch with typo tolerance
 */
const searchUMKM = async (query, filters = {}) => {
  try {
    const isAvailable = await isMeilisearchAvailable();
    if (!isAvailable) {
      console.log('⚠️ Meilisearch tidak tersedia, fallback ke MongoDB');
      return {
        success: false,
        fallback: true,
        hits: []
      };
    }

    const index = meilisearchClient.index(UMKM_INDEX);

    // Build filter string
    let filterArray = [];

    if (filters.kategori && filters.kategori !== 'Semua') {
      filterArray.push(`kategori = "${filters.kategori}"`);
    }

    if (filters.status) {
      filterArray.push(`status = "${filters.status}"`);
    }

    if (filters.user_id) {
      filterArray.push(`user_id = "${filters.user_id}"`);
    }

    if (filters.kecamatan) {
      filterArray.push(`kecamatan = "${filters.kecamatan}"`);
    }

    // Search options with typo tolerance enabled by default
    const searchOptions = {
      limit: filters.limit || 100,
      offset: filters.offset || 0,
      attributesToHighlight: ['nama_umkm', 'deskripsi', 'alamat'],
      highlightPreTag: '<mark>',
      highlightPostTag: '</mark>',
      matchingStrategy: 'last' // 'last' is more lenient for typos
    };

    if (filterArray.length > 0) {
      searchOptions.filter = filterArray.join(' AND ');
    }

    if (filters.sort) {
      searchOptions.sort = [filters.sort];
    }

    // Perform search
    const results = await index.search(query, searchOptions);

    return {
      success: true,
      hits: results.hits,
      processingTimeMs: results.processingTimeMs,
      query: results.query,
      estimatedTotalHits: results.estimatedTotalHits
    };
  } catch (error) {
    console.error('❌ Error searching UMKM:', error.message);
    return {
      success: false,
      fallback: true,
      error: error.message,
      hits: []
    };
  }
};

/**
 * Get Meilisearch statistics
 */
const getSearchStats = async () => {
  try {
    const isAvailable = await isMeilisearchAvailable();
    if (!isAvailable) {
      return { success: false, error: 'Meilisearch tidak tersedia' };
    }

    const index = meilisearchClient.index(UMKM_INDEX);
    const stats = await index.getStats();
    return { success: true, stats };
  } catch (error) {
    console.error('❌ Error getting search stats:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  indexUMKM,
  indexAllUMKM,
  updateUMKMIndex,
  deleteUMKMIndex,
  searchUMKM,
  getSearchStats,
  isMeilisearchAvailable
};

