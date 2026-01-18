const { MeiliSearch } = require('meilisearch');

// Meilisearch configuration
const meilisearchClient = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST || 'http://127.0.0.1:7700',
  apiKey: process.env.MEILISEARCH_API_KEY || ''
});

// Index name for UMKM
const UMKM_INDEX = 'umkm';

// Check if Meilisearch is available
const checkMeilisearchConnection = async () => {
  try {
    await meilisearchClient.health();
    return true;
  } catch (error) {
    return false;
  }
};

// Initialize Meilisearch index with settings
const initializeMeilisearch = async () => {
  try {
    // Check connection first
    const isConnected = await checkMeilisearchConnection();
    if (!isConnected) {
      console.log('⚠️ Meilisearch tidak tersedia, menggunakan MongoDB untuk search');
      return false;
    }

    // Delete existing index to ensure clean settings
    try {
      await meilisearchClient.deleteIndex(UMKM_INDEX);
      console.log('🗑️ Index lama dihapus untuk reset settings');
      // Wait for deletion to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (err) {
      // Index might not exist, that's okay
      console.log('ℹ️ Tidak ada index lama untuk dihapus');
    }

    // Create fresh index
    await meilisearchClient.createIndex(UMKM_INDEX, { primaryKey: 'id' });
    console.log('✅ Index baru dibuat');

    // Get the index
    const index = meilisearchClient.index(UMKM_INDEX);

    // Configure searchable attributes - HANYA nama_umkm
    // Ini memastikan search hanya mencari di judul UMKM, bukan deskripsi
    await index.updateSearchableAttributes([
      'nama_umkm'
    ]);

    // Configure filterable attributes (fields that can be filtered)
    await index.updateFilterableAttributes([
      'kategori',
      'status',
      'user_id',
      'kecamatan'
    ]);

    // Configure sortable attributes
    await index.updateSortableAttributes([
      'createdAt',
      'nama_umkm',
      'views'
    ]);

    // Configure displayed attributes (fields returned in search results)
    await index.updateDisplayedAttributes([
      '_id',
      'nama_umkm',
      'deskripsi',
      'kategori',
      'alamat',
      'kecamatan',
      'jam_operasional',
      'nomor_telepon',
      'whatsapp',
      'instagram',
      'foto_umkm',
      'status',
      'user_id',
      'nama_user',
      'lokasi',
      'maps',
      'pembayaran',
      'views',
      'createdAt',
      'updatedAt'
    ]);

    // Configure ranking rules for relevance
    await index.updateRankingRules([
      'words',
      'typo',
      'proximity',
      'attribute',
      'sort',
      'exactness'
    ]);

    // Configure typo tolerance settings
    await index.updateTypoTolerance({
      enabled: true,
      minWordSizeForTypos: {
        oneTypo: 3,   // Allow 1 typo for words with 3+ characters
        twoTypos: 6   // Allow 2 typos for words with 6+ characters
      },
      disableOnWords: [],
      disableOnAttributes: []
    });

    // Configure synonyms for better search results
    await index.updateSynonyms({
      // Category synonyms
      'kuliner': ['makanan', 'minuman', 'food', 'beverages', 'makan', 'minum', 'resto', 'restoran', 'warung', 'cafe', 'kafe'],
      'makanan': ['kuliner', 'food', 'makan'],
      'fashion': ['pakaian', 'baju', 'clothing', 'busana', 'konveksi', 'garment'],
      'pakaian': ['fashion', 'baju', 'clothing'],
      'kerajinan': ['craft', 'handmade', 'handcraft', 'kriya', 'seni'],
      'jasa': ['service', 'layanan', 'servis'],
      'agribisnis': ['pertanian', 'agriculture', 'tani', 'farm', 'agro'],
      'pertanian': ['agribisnis', 'agriculture', 'tani'],
      'toko': ['kelontong', 'warung', 'shop', 'store', 'retail'],
      'kelontong': ['toko', 'warung', 'sembako'],

      // Common typos and variations
      'nasi': ['nasgor', 'nasgore'],
      'ayam': ['aym'],
      'bakso': ['baso', 'bakmi'],
      'mie': ['mi', 'mie ayam', 'miayam'],
      'sate': ['satai', 'sati'],
      'kopi': ['coffee', 'kofe', 'kofee'],
      'es': ['ice', 'ais'],

      // Location synonyms
      'solo': ['surakarta', 'sala'],
      'surakarta': ['solo', 'sala'],
      'klaten': ['kltn'],
      'boyolali': ['boyolal'],
      'sukoharjo': ['skh', 'skoharjo'],
      'karanganyar': ['kra', 'karanganyar'],
      'sragen': ['srgn'],
      'wonogiri': ['wng', 'wonogri']
    });

    // Configure stop words (words to ignore in search)
    await index.updateStopWords([
      'dan', 'atau', 'yang', 'di', 'ke', 'dari', 'untuk', 'dengan',
      'adalah', 'ini', 'itu', 'juga', 'sudah', 'saya', 'anda',
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'
    ]);

    // Configure pagination settings
    await index.updatePagination({
      maxTotalHits: 1000
    });

    console.log('✅ Meilisearch index initialized successfully with typo tolerance');
    return true;
  } catch (error) {
    console.error('❌ Error initializing Meilisearch:', error);
    return false;
  }
};

// Search UMKM with typo tolerance
const searchUMKM = async (query, filters = {}, options = {}) => {
  try {
    const isConnected = await checkMeilisearchConnection();
    if (!isConnected) {
      return { success: false, fallback: true };
    }

    const index = meilisearchClient.index(UMKM_INDEX);

    // Build filter string
    let filterArray = [];
    if (filters.status) {
      filterArray.push(`status = "${filters.status}"`);
    }
    if (filters.kategori && filters.kategori !== 'Semua') {
      filterArray.push(`kategori = "${filters.kategori}"`);
    }
    if (filters.kecamatan) {
      filterArray.push(`kecamatan = "${filters.kecamatan}"`);
    }

    const searchParams = {
      filter: filterArray.length > 0 ? filterArray.join(' AND ') : undefined,
      limit: options.limit || 100,
      offset: options.offset || 0,
      attributesToHighlight: ['nama_umkm', 'deskripsi', 'alamat'],
      highlightPreTag: '<mark>',
      highlightPostTag: '</mark>',
      matchingStrategy: 'all' // 'all' or 'last' - 'all' is more strict
    };

    // Add sort if specified
    if (options.sort) {
      searchParams.sort = [options.sort];
    }

    const result = await index.search(query, searchParams);

    return {
      success: true,
      hits: result.hits,
      totalHits: result.estimatedTotalHits,
      processingTimeMs: result.processingTimeMs,
      query: result.query
    };
  } catch (error) {
    console.error('Meilisearch search error:', error);
    return { success: false, error: error.message, fallback: true };
  }
};

// Add or update document in Meilisearch
const indexUMKM = async (umkmData) => {
  try {
    const isConnected = await checkMeilisearchConnection();
    if (!isConnected) return false;

    const index = meilisearchClient.index(UMKM_INDEX);

    // Prepare document for indexing
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
      user_id: umkmData.user_id?.toString() || '',
      nama_user: umkmData.nama_user || '',
      lokasi: umkmData.lokasi || {},
      maps: umkmData.maps || '',
      pembayaran: umkmData.pembayaran || [],
      views: umkmData.views || 0,
      createdAt: umkmData.createdAt,
      updatedAt: umkmData.updatedAt
    };

    await index.addDocuments([document], { primaryKey: 'id' });
    return true;
  } catch (error) {
    console.error('Error indexing UMKM:', error);
    return false;
  }
};

// Delete document from Meilisearch
const deleteUMKMFromIndex = async (umkmId) => {
  try {
    const isConnected = await checkMeilisearchConnection();
    if (!isConnected) return false;

    const index = meilisearchClient.index(UMKM_INDEX);
    await index.deleteDocument(umkmId.toString());
    return true;
  } catch (error) {
    console.error('Error deleting UMKM from index:', error);
    return false;
  }
};

// Sync all UMKM from MongoDB to Meilisearch
const syncAllUMKM = async (umkmList) => {
  try {
    const isConnected = await checkMeilisearchConnection();
    if (!isConnected) return false;

    const index = meilisearchClient.index(UMKM_INDEX);

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
      user_id: umkm.user_id?.toString() || '',
      nama_user: umkm.nama_user || '',
      lokasi: umkm.lokasi || {},
      maps: umkm.maps || '',
      pembayaran: umkm.pembayaran || [],
      views: umkm.views || 0,
      createdAt: umkm.createdAt,
      updatedAt: umkm.updatedAt
    }));

    await index.addDocuments(documents, { primaryKey: 'id' });
    console.log(`✅ Synced ${documents.length} UMKM to Meilisearch`);
    return true;
  } catch (error) {
    console.error('Error syncing UMKM to Meilisearch:', error);
    return false;
  }
};

module.exports = {
  meilisearchClient,
  UMKM_INDEX,
  initializeMeilisearch,
  checkMeilisearchConnection,
  searchUMKM,
  indexUMKM,
  deleteUMKMFromIndex,
  syncAllUMKM
};

