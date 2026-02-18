const https = require('https');
const http = require('http');

/**
 * Resolve Google Maps shortlinks ke URL lengkap
 * @param {string} shortUrl - Shortlink URL (goo.gl, maps.app.goo.gl)
 * @returns {Promise<string>} - Resolved URL atau original URL
 */
const resolveShortlink = (shortUrl) => {
    return new Promise((resolve) => {
        if (!shortUrl) {
            resolve(shortUrl);
            return;
        }

        const timeout = setTimeout(() => {
            console.log('⏱️ Shortlink resolution timeout');
            resolve(shortUrl);
        }, 5000); // 5 second timeout

        try {
            const protocol = shortUrl.startsWith('https') ? https : http;

            const req = protocol.get(shortUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            }, (res) => {
                clearTimeout(timeout);

                // Handle redirect
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    // Recursively resolve if still a redirect
                    if (res.headers.location.includes('goo.gl') || res.headers.location.includes('maps.app')) {
                        resolveShortlink(res.headers.location).then(resolve);
                    } else {
                        resolve(res.headers.location);
                    }
                } else {
                    resolve(shortUrl);
                }
            });

            req.on('error', (err) => {
                clearTimeout(timeout);
                console.warn('⚠️ Shortlink resolution error:', err.message);
                resolve(shortUrl);
            });
        } catch (error) {
            clearTimeout(timeout);
            resolve(shortUrl);
        }
    });
};

/**
 * Extract coordinates from Google Maps URL
 * Supports multiple URL formats
 */
const extractCoordinates = (mapsUrl) => {
    if (!mapsUrl) return null;

    const value = String(mapsUrl).trim();

    // Direct coordinate format: "-7.5598, 110.8290"
    const plainCoordinatePattern = /^\s*([+-]?\d+\.?\d*)\s*,\s*([+-]?\d+\.?\d*)\s*$/;
    const plainMatch = value.match(plainCoordinatePattern);
    if (plainMatch) {
        const lat = parseFloat(plainMatch[1]);
        const lng = parseFloat(plainMatch[2]);
        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            return { latitude: lat, longitude: lng };
        }
    }

    let decodedValue = value;
    try {
        decodedValue = decodeURIComponent(value);
    } catch {
        decodedValue = value;
    }

    // Enhanced patterns for various Google Maps URL formats
    const patterns = [
        /@([+-]?\d+\.?\d*),\+?([+-]?\d+\.?\d*)/,           // @lat,lng format
        /q=([+-]?\d+\.?\d*),\+?([+-]?\d+\.?\d*)/,          // q=lat,lng format  
        /ll=([+-]?\d+\.?\d*),\+?([+-]?\d+\.?\d*)/,         // ll=lat,lng format
        /place\/.*\/@([+-]?\d+\.?\d*),\+?([+-]?\d+\.?\d*)/, // place/@lat,lng format
        /!3d([+-]?\d+\.?\d*)!4d([+-]?\d+\.?\d*)/,       // !3d lat !4d lng format
        /center=([+-]?\d+\.?\d*),\+?([+-]?\d+\.?\d*)/,     // center=lat,lng format
        /destination=([+-]?\d+\.?\d*),\+?([+-]?\d+\.?\d*)/, // destination=lat,lng format
        /search\/([+-]?\d+\.?\d*),\+?([+-]?\d+\.?\d*)/, // search/lat,+lng format
        /saddr=([+-]?\d+\.?\d*),\+?([+-]?\d+\.?\d*)/, // saddr=lat,lng format
        /daddr=([+-]?\d+\.?\d*),\+?([+-]?\d+\.?\d*)/, // daddr=lat,lng format
        /!1d([+-]?\d+\.?\d*)!2d([+-]?\d+\.?\d*)/,       // !1d lng !2d lat format (reversed)
    ];

    for (const pattern of patterns) {
        const match = decodedValue.match(pattern);
        if (match) {
            let lat = parseFloat(match[1]);
            let lng = parseFloat(match[2]);

            // Handle reversed format (!1d lng !2d lat)
            if (pattern.toString().includes('!1d')) {
                [lat, lng] = [lng, lat];
            }

            // Validate coordinates
            if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                return { latitude: lat, longitude: lng };
            }
        }
    }

    return null;
};

// @desc    Resolve Google Maps shortlink
// @route   POST /api/maps/resolve
// @access  Public
exports.resolveShortlink = async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({
                success: false,
                message: 'URL tidak boleh kosong'
            });
        }

        // Check if it's a shortlink
        const isShortlink = url.includes('goo.gl') || url.includes('maps.app');

        let resolvedUrl = url;
        if (isShortlink) {
            resolvedUrl = await resolveShortlink(url);
        }

        // Extract coordinates from resolved URL
        const coordinates = extractCoordinates(resolvedUrl);

        res.json({
            success: true,
            data: {
                originalUrl: url,
                resolvedUrl: resolvedUrl,
                isShortlink: isShortlink,
                coordinates: coordinates
            }
        });
    } catch (error) {
        console.error('Error resolving shortlink:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal memproses URL',
            error: error.message
        });
    }
};

// @desc    Extract coordinates from Maps URL
// @route   POST /api/maps/coordinates
// @access  Public
exports.extractCoordinates = async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({
                success: false,
                message: 'URL tidak boleh kosong'
            });
        }

        // Check if shortlink, resolve first
        let processedUrl = url;
        if (url.includes('goo.gl') || url.includes('maps.app')) {
            processedUrl = await resolveShortlink(url);
        }

        const coordinates = extractCoordinates(processedUrl);

        if (!coordinates) {
            return res.status(400).json({
                success: false,
                message: 'Tidak dapat mengekstrak koordinat dari URL',
                data: {
                    originalUrl: url,
                    resolvedUrl: processedUrl
                }
            });
        }

        res.json({
            success: true,
            data: {
                originalUrl: url,
                resolvedUrl: processedUrl,
                coordinates: coordinates
            }
        });
    } catch (error) {
        console.error('Error extracting coordinates:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengekstrak koordinat',
            error: error.message
        });
    }
};

// @desc    Validate Google Maps URL
// @route   POST /api/maps/validate
// @access  Public
exports.validateMapsUrl = async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({
                success: false,
                message: 'URL tidak boleh kosong'
            });
        }

        // Check if it's a Google Maps URL
        const isGoogleMaps = url.includes('google.com/maps') ||
            url.includes('goo.gl') ||
            url.includes('maps.app.goo.gl') ||
            url.includes('maps.google.com');

        if (!isGoogleMaps) {
            return res.json({
                success: true,
                data: {
                    isValid: false,
                    isGoogleMaps: false,
                    message: 'Bukan URL Google Maps yang valid'
                }
            });
        }

        // Try to resolve and extract coordinates
        let resolvedUrl = url;
        if (url.includes('goo.gl') || url.includes('maps.app')) {
            resolvedUrl = await resolveShortlink(url);
        }

        const coordinates = extractCoordinates(resolvedUrl);

        res.json({
            success: true,
            data: {
                isValid: !!coordinates,
                isGoogleMaps: true,
                isShortlink: url !== resolvedUrl,
                resolvedUrl: resolvedUrl,
                coordinates: coordinates,
                message: coordinates ? 'URL valid dan koordinat ditemukan' : 'URL valid tapi koordinat tidak ditemukan'
            }
        });
    } catch (error) {
        console.error('Error validating maps URL:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal memvalidasi URL',
            error: error.message
        });
    }
};

// Export helper functions for use in other controllers
module.exports.resolveShortlinkHelper = resolveShortlink;
module.exports.extractCoordinatesHelper = extractCoordinates;
