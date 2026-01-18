#!/bin/bash

# ==========================================
# Meilisearch Setup Script for Production
# ==========================================

echo "🚀 Setting up Meilisearch..."

# Check if Meilisearch already exists
if [ -f "./meilisearch" ]; then
    echo "✅ Meilisearch already installed"
    ./meilisearch --version
    exit 0
fi

# Download Meilisearch
echo "📥 Downloading Meilisearch..."
curl -L https://install.meilisearch.com | sh

# Make executable
chmod +x meilisearch

# Verify installation
if [ -f "./meilisearch" ]; then
    echo "✅ Meilisearch installed successfully!"
    ./meilisearch --version
else
    echo "❌ Failed to install Meilisearch"
    exit 1
fi

echo ""
echo "=========================================="
echo "📋 Next Steps:"
echo "=========================================="
echo "1. Create a .env file with MEILISEARCH_API_KEY"
echo "2. Start Meilisearch with: ./start-meilisearch.sh"
echo "3. Start backend with: npm run start"
echo ""
