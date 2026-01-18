# Meilisearch Setup Guide

## Prerequisites

1. Download Meilisearch:
   - Windows: https://github.com/meilisearch/meilisearch/releases/latest
   - Download `meilisearch-windows-amd64.exe`
   - Rename to `meilisearch.exe`

## Quick Start

### 1. Start Meilisearch Server

**Windows:**
```bash
# Navigate to backend folder
cd backend

# Start Meilisearch (default port 7700)
./meilisearch.exe --master-key="MASTER_KEY_CHANGE_THIS"
```

**Alternative: Using NPM script**
```bash
npm run meilisearch
```

### 2. Configure Environment Variables

Add to your `.env` file:
```env
MEILISEARCH_HOST=http://127.0.0.1:7700
MEILISEARCH_API_KEY=MASTER_KEY_CHANGE_THIS
```

### 3. Index Your Data

```bash
# Run initial indexing
npm run index-search

# Or manually
node indexToMeilisearch.js
```

### 4. Start Backend Server

```bash
npm start
```

## API Endpoints

### Public Search
```
GET /api/search?q=kuliner&kategori=Kuliner&limit=20
```

### Admin Endpoints

**Reindex all UMKM:**
```
POST /api/search/reindex
Authorization: Bearer <admin_token>
```

**Get search statistics:**
```
GET /api/search/stats
Authorization: Bearer <admin_token>
```

## Features

✅ **Lightning Fast Search** - Sub-millisecond response times
✅ **Typo Tolerance** - Finds results even with spelling mistakes  
✅ **Filters** - Search by category, status, etc.
✅ **Highlighting** - Search terms highlighted in results
✅ **Auto-sync** - Automatic indexing on create/update/delete
✅ **Fallback** - Falls back to MongoDB if Meilisearch is unavailable

## Search Performance

- **MongoDB regex search**: ~50-200ms
- **Meilisearch**: <5ms (10-40x faster!)

## Monitoring

Access Meilisearch dashboard at: http://127.0.0.1:7700

## Troubleshooting

**Meilisearch not running?**
- Check if port 7700 is available
- Make sure meilisearch.exe is in the backend folder
- Try running with admin privileges

**Index not updated?**
- Run reindex: `POST /api/search/reindex`
- Check backend logs for errors

**Search returns no results?**
- Verify Meilisearch is running
- Check if data is indexed: `GET /api/search/stats`
- System falls back to MongoDB automatically

## Production Deployment

For production, consider:
1. Meilisearch Cloud: https://www.meilisearch.com/cloud
2. Self-hosted with Docker
3. Use environment-specific API keys
