const mongoose = require('./config/database');
const UMKM = require('./models/Umkm');
const https = require('https');

// Helper to resolve short URLs
const resolveUrl = (shortUrl) => {
  return new Promise((resolve) => {
    try {
      const timeout = setTimeout(() => resolve(shortUrl), 5000); // 5s timeout
      
      https.get(shortUrl, { maxRedirects: 10 }, (res) => {
        clearTimeout(timeout);
        resolve(res.url || res.headers.location || shortUrl);
      }).on('error', () => {
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
      /@(-?\d+\.\d+),(-?\d+\.\d+)/, // @lat,lng format
      /q=(-?\d+\.\d+),(-?\d+\.\d+)/, // q=lat,lng format
      /ll=(-?\d+\.\d+),(-?\d+\.\d+)/, // ll=lat,lng format
    ];

    for (const pattern of patterns) {
      const match = mapsUrl.match(pattern);
      if (match) {
        const lat = parseFloat(match[1]);
        const lng = parseFloat(match[2]);
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
          const lat = parseFloat(match[1]);
          const lng = parseFloat(match[2]);
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
    await mongoose;
    console.log('\n✅ MongoDB Connected');
    
    // Find UMKM tanpa lokasi tapi punya maps URL
    const umkmWithoutLokasi = await UMKM.find({
      maps: { $ne: null, $ne: '' },
      $or: [
        { 'lokasi.latitude': null },
        { lokasi: null }
      ]
    });

    console.log(`\n📊 Found ${umkmWithoutLokasi.length} UMKM without lokasi but with maps URL\n`);

    for (const umkm of umkmWithoutLokasi) {
      console.log(`\n🏪 ${umkm.nama_umkm}`);
      const coordinates = await extractCoordinatesFromUrl(umkm.maps);
      
      if (coordinates) {
        umkm.lokasi = coordinates;
        await umkm.save();
        console.log(`✅ Updated: lokasi = ${coordinates.latitude}, ${coordinates.longitude}`);
      } else {
        console.log('❌ Could not extract coordinates');
      }
    }

    console.log('\n\n✅ Process completed!\n');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

fixLokasiFromMapsUrl();
