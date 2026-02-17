require('dotenv').config();
const connectDB = require('./config/database');
const UMKM = require('./models/Umkm');
const https = require('https');
const http = require('http');

// Helper to resolve short URLs
const resolveUrl = (shortUrl) => {
  return new Promise((resolve) => {
    try {
      const timeout = setTimeout(() => resolve(shortUrl), 5000);
      const protocol = shortUrl.startsWith('https') ? https : http;

      const req = protocol.get(shortUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }, (res) => {
        clearTimeout(timeout);

        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const nextUrl = res.headers.location.startsWith('http')
            ? res.headers.location
            : new URL(res.headers.location, shortUrl).toString();
          return resolve(resolveUrl(nextUrl));
        }

        resolve(shortUrl);
      });

      req.on('error', () => {
        clearTimeout(timeout);
        resolve(shortUrl);
      });
    } catch (error) {
      resolve(shortUrl);
    }
  });
};

// Extract coordinates from URL
const extractCoordinatesFromUrl = async (mapsUrl) => {
  if (!mapsUrl) return null;

  try {
    console.log(`🔍 Extracting from: ${mapsUrl}`);
    
    // First try direct extraction
    const patterns = [
      /@(-?\d+\.?\d*),(-?\d+\.?\d*)/, // @lat,lng format
      /q=(-?\d+\.?\d*),(-?\d+\.?\d*)/, // q=lat,lng format
      /ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/, // ll=lat,lng format
      /place\/.*\/@(-?\d+\.?\d*),(-?\d+\.?\d*)/, // place/@lat,lng format
      /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/, // !3d lat !4d lng format
      /center=(-?\d+\.?\d*),(-?\d+\.?\d*)/, // center=lat,lng format
      /destination=(-?\d+\.?\d*),(-?\d+\.?\d*)/, // destination=lat,lng format
      /!1d(-?\d+\.?\d*)!2d(-?\d+\.?\d*)/, // !1d lng !2d lat format (reversed)
    ];

    for (const pattern of patterns) {
      const match = mapsUrl.match(pattern);
      if (match) {
        let lat = parseFloat(match[1]);
        let lng = parseFloat(match[2]);

        if (pattern.toString().includes('!1d')) {
          [lat, lng] = [lng, lat];
        }

        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          console.log(`✅ Direct extraction: ${lat}, ${lng}`);
          return { latitude: lat, longitude: lng };
        }
      }
    }

    // If direct extraction failed, resolve shortlink
    console.log('🔗 Direct extraction failed, resolving shortlink...');
    const expandedUrl = await resolveUrl(mapsUrl);
    console.log(`📌 Expanded URL: ${expandedUrl}`);
    
    if (expandedUrl && expandedUrl !== mapsUrl) {
      // Try extract from expanded URL
      for (const pattern of patterns) {
        const match = expandedUrl.match(pattern);
        if (match) {
          let lat = parseFloat(match[1]);
          let lng = parseFloat(match[2]);

          if (pattern.toString().includes('!1d')) {
            [lat, lng] = [lng, lat];
          }

          if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            console.log(`✅ Resolved extraction: ${lat}, ${lng}`);
            return { latitude: lat, longitude: lng };
          }
        }
      }
    }
  } catch (error) {
    console.warn('⚠️ Error:', error.message);
  }

  return null;
};

const fixLokasiFromMapsUrl = async () => {
  try {
    const isDryRun = process.argv.includes('--dry-run');

    await connectDB();
    console.log('\n✅ MongoDB Connected');
    if (isDryRun) {
      console.log('🧪 Running in DRY RUN mode (no database updates)');
    }
    
    // Find UMKM tanpa lokasi tapi punya maps URL
    const umkmWithoutLokasi = await UMKM.find({
      maps: { $ne: null, $ne: '' },
      $or: [
        { 'lokasi.latitude': null },
        { 'lokasi.longitude': null },
        { lokasi: null }
      ]
    });

    console.log(`\n📊 Found ${umkmWithoutLokasi.length} UMKM without lokasi but with maps URL\n`);

    let updatedCount = 0;
    let failedCount = 0;

    for (const umkm of umkmWithoutLokasi) {
      console.log(`\n🏪 ${umkm.nama_umkm}`);
      const coordinates = await extractCoordinatesFromUrl(umkm.maps);
      
      if (coordinates) {
        if (!isDryRun) {
          umkm.lokasi = coordinates;
          await umkm.save();
        }
        updatedCount += 1;
        console.log(`✅ ${isDryRun ? 'Would update' : 'Updated'}: lokasi = ${coordinates.latitude}, ${coordinates.longitude}`);
      } else {
        failedCount += 1;
        console.log('❌ Could not extract coordinates');
      }
    }

    console.log(`\n\n✅ Process completed! Updated: ${updatedCount}, Failed: ${failedCount}\n`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

fixLokasiFromMapsUrl();
