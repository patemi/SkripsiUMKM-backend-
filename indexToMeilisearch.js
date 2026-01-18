require('dotenv').config();
const mongoose = require('mongoose');
const { initializeMeilisearch } = require('./config/meilisearch');
const { indexAllUMKM, getSearchStats } = require('./services/searchService');

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/umkm_db');
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

// Main indexing function
const runIndexing = async () => {
  try {
    console.log('🚀 Starting Meilisearch indexing process...\n');
    
    // Step 1: Connect to MongoDB
    console.log('Step 1: Connecting to MongoDB...');
    await connectDB();
    
    // Step 2: Initialize Meilisearch
    console.log('\nStep 2: Initializing Meilisearch...');
    await initializeMeilisearch();
    
    // Step 3: Index all UMKM
    console.log('\nStep 3: Indexing all approved UMKM...');
    const result = await indexAllUMKM();
    
    if (result.success) {
      console.log(`\n✅ Successfully indexed ${result.count} UMKM documents`);
      console.log(`Task UID: ${result.taskUid}`);
    } else {
      console.error('\n❌ Indexing failed:', result.error);
    }
    
    // Step 4: Get statistics
    console.log('\nStep 4: Getting search statistics...');
    const stats = await getSearchStats();
    
    if (stats.success) {
      console.log('\n📊 Meilisearch Statistics:');
      console.log(JSON.stringify(stats.stats, null, 2));
    }
    
    console.log('\n✅ Indexing process completed!');
    console.log('\n💡 Your search engine is now optimized with Meilisearch');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during indexing:', error);
    process.exit(1);
  }
};

// Run the indexing
runIndexing();
