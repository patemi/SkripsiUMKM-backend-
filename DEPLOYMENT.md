# Production Deployment Guide

## Quick Start on VPS

### 1. Clone Repository
```bash
git clone https://github.com/YOUR_USERNAME/REPO_NAME.git
cd backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Meilisearch
```bash
chmod +x setup-meilisearch.sh start-meilisearch.sh
./setup-meilisearch.sh
```

### 4. Configure Environment
```bash
cp .env.example .env
nano .env
```

Edit `.env` with your production values:
```env
MONGO_URI=mongodb://your-mongo-uri
JWT_SECRET=your-jwt-secret
MEILISEARCH_HOST=http://127.0.0.1:7700
MEILISEARCH_API_KEY=your-secure-master-key
FRONTEND_URL=https://your-frontend-domain.com
```

### 5. Start Services

**Option A: Using PM2 (Recommended)**
```bash
# Install PM2
npm install -g pm2

# Start Meilisearch
pm2 start ./start-meilisearch.sh --name meilisearch

# Start Backend
pm2 start npm --name backend -- run start

# Save process list
pm2 save

# Enable startup on reboot
pm2 startup
```

**Option B: Manual (for testing)**
```bash
# Terminal 1 - Start Meilisearch
./start-meilisearch.sh

# Terminal 2 - Start Backend
npm run start
```

### 6. Setup Nginx (Optional)
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Troubleshooting

### Meilisearch not starting
```bash
# Check if port 7700 is in use
lsof -i :7700

# Check Meilisearch logs
pm2 logs meilisearch
```

### Backend not connecting to Meilisearch
- Ensure Meilisearch is running: `curl http://127.0.0.1:7700/health`
- Check MEILISEARCH_API_KEY matches in .env and Meilisearch

### Permission denied on scripts
```bash
chmod +x *.sh
```
