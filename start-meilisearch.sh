#!/bin/bash

# ==========================================
# Start Meilisearch for Production
# ==========================================

# Load environment variables if .env exists
if [ -f ".env" ]; then
    export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
fi

# Default master key if not set
MASTER_KEY=${MEILISEARCH_API_KEY:-"your-secure-master-key-change-this"}

echo "🚀 Starting Meilisearch..."
echo "📍 Host: http://127.0.0.1:7700"

# Check if Meilisearch exists
if [ ! -f "./meilisearch" ]; then
    echo "❌ Meilisearch not found. Run ./setup-meilisearch.sh first"
    exit 1
fi

# Start Meilisearch with production settings
./meilisearch \
    --master-key="$MASTER_KEY" \
    --http-addr="127.0.0.1:7700" \
    --env="production" \
    --db-path="./meili_data"
