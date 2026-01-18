const mongoose = require('mongoose');
const https = require('https');
const Umkm = require('./models/Umkm');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/umkm_db')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Helper function to resolve shortlinks
function resolveUrl(shortUrl, timeout = 3000) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      req.abort();
      reject(new Error('Request timeout'));
    }, timeout);

    const req = https.get(shortUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      clearTimeout(timeoutId);
      
      if (res.statusCode === 301 || res.statusCode === 302) {
        resolve(res.headers.location);
      } else {
        reject(new Error(`Unexpected status code: ${res.statusCode}`));
      }
    });

    req.on('error', (error) => {
      clearTimeout(timeoutId);
      reject(error);
    });
  });
}

// Helper function to extract coordinates from URL
function extractCoordinatesFromUrl(mapsUrl) {
  try {
    // Pattern 1: @lat,lng format
    const pattern1 = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
    const match1 = mapsUrl.match(pattern1);
    if (match1) {
      return { latitude: parseFloat(match1[1]), longitude: parseFloat(match1[2]) };
    }

    // Pattern 2: ?q=lat,lng format
    const pattern2 = /q=(-?\d+\.\d+),(-?\d+\.\d+)/;
    const match2 = mapsUrl.match(pattern2);
    if (match2) {
      return { latitude: parseFloat(match2[1]), longitude: parseFloat(match2[2]) };
    }

    // Pattern 3: ll=lat,lng format
    const pattern3 = /ll=(-?\d+\.\d+),(-?\d+\.\d+)/;
    const match3 = mapsUrl.match(pattern3);
    if (match3) {
      return { latitude: parseFloat(match3[1]), longitude: parseFloat(match3[2]) };
    }

    // Pattern 4: /search/lat,+lng format
    const pattern4 = /search\/(-?\d+\.\d+),\s*\+?(-?\d+\.\d+)/;
    const match4 = mapsUrl.match(pattern4);
    if (match4) {
      return { latitude: parseFloat(match4[1]), longitude: parseFloat(match4[2]) };
    }

    // Pattern 5: place coordinates in URL path (%C2%B0 format)
    const pattern5 = /(\d+)%C2%B0(\d+)'([\d.]+)%22([NS])\+(\d+)%C2%B0(\d+)'([\d.]+)%22([EW])/;
    const match5 = mapsUrl.match(pattern5);
    if (match5) {
      const latDeg = parseInt(match5[1]);
      const latMin = parseInt(match5[2]);
      const latSec = parseFloat(match5[3]);
      const latDir = match5[4];
      const lngDeg = parseInt(match5[5]);
      const lngMin = parseInt(match5[6]);
      const lngSec = parseFloat(match5[7]);
      const lngDir = match5[8];
      
      const lat = (latDeg + latMin/60 + latSec/3600) * (latDir === 'S' ? -1 : 1);
      const lng = (lngDeg + lngMin/60 + lngSec/3600) * (lngDir === 'W' ? -1 : 1);
      
      return { latitude: lat, longitude: lng };
    }

    return null;
  } catch (error) {
    console.error('Extract error:', error.message);
    return null;
  }
}

async function fixMapIntegration() {
  try {
    console.log('\n=== FIXING MAP INTEGRATION ===\n');

    // Find all UMKM with maps but no valid lokasi
    const umkmsToFix = await Umkm.find({
      status: 'approved',
      maps: { $exists: true, $ne: null, $ne: '' },
      $or: [
        { 'lokasi.latitude': { $exists: false } },
        { 'lokasi.latitude': null },
        { 'lokasi': { $exists: false } }
      ]
    });

    console.log(`Found ${umkmsToFix.length} UMKM to fix:\n`);

    let fixed = 0;
    let failed = 0;

    for (const umkm of umkmsToFix) {
      console.log(`Processing: ${umkm.nama_umkm} (ID: ${umkm._id})`);
      console.log(`  Maps data: ${umkm.maps}`);

      // Check if maps field contains coordinates (lat,lng format)
      const coordPattern = /^-?\d+\.?\d*,\s*-?\d+\.?\d*$/;
      
      if (coordPattern.test(umkm.maps)) {
        // Direct coordinates in maps field
        const [lat, lng] = umkm.maps.split(',').map(c => parseFloat(c.trim()));
        
        umkm.lokasi = {
          latitude: lat,
          longitude: lng
        };

        await umkm.save();
        console.log(`  ✅ Fixed with coordinates: ${lat}, ${lng}\n`);
        fixed++;
      } else if (umkm.maps.includes('goo.gl') || umkm.maps.includes('maps.app.goo.gl')) {
        // Google shortlink - try to resolve
        console.log(`  🔄 Resolving shortlink...`);
        try {
          const expandedUrl = await resolveUrl(umkm.maps);
          console.log(`  Expanded URL: ${expandedUrl}`);
          
          const coords = extractCoordinatesFromUrl(expandedUrl);
          if (coords) {
            umkm.lokasi = coords;
            await umkm.save();
            console.log(`  ✅ Fixed with coordinates: ${coords.latitude}, ${coords.longitude}\n`);
            fixed++;
          } else {
            console.log(`  ❌ Could not extract coordinates from expanded URL\n`);
            failed++;
          }
        } catch (error) {
          console.log(`  ❌ Failed to resolve shortlink: ${error.message}\n`);
          failed++;
        }
      } else {
        // Try to extract from regular URL
        const coords = extractCoordinatesFromUrl(umkm.maps);
        if (coords) {
          umkm.lokasi = coords;
          await umkm.save();
          console.log(`  ✅ Fixed with coordinates: ${coords.latitude}, ${coords.longitude}\n`);
          fixed++;
        } else {
          console.log(`  ❌ Unknown format - could not extract coordinates\n`);
          failed++;
        }
      }
    }

    console.log('\n=== SUMMARY ===');
    console.log(`✅ Fixed: ${fixed}`);
    console.log(`❌ Failed/Skipped: ${failed}`);
    console.log(`📊 Total: ${umkmsToFix.length}\n`);

    // Show remaining issues
    const remaining = await Umkm.find({
      status: 'approved',
      $or: [
        { 'lokasi.latitude': { $exists: false } },
        { 'lokasi.latitude': null },
        { 'lokasi': { $exists: false } }
      ]
    });

    if (remaining.length > 0) {
      console.log('\n⚠️  UMKM still without location:');
      for (const umkm of remaining) {
        console.log(`  - ${umkm.nama_umkm} (ID: ${umkm._id})`);
        if (umkm.maps) console.log(`    Maps: ${umkm.maps}`);
      }
    } else {
      console.log('\n🎉 All approved UMKM now have location data!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  }
}

// Run the fix
fixMapIntegration();
