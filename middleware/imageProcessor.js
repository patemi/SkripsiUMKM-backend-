const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

/**
 * Middleware untuk memproses dan mengoptimasi gambar yang diupload
 * - Resize ke max 800px width
 * - Compress dengan quality 80%
 * - Convert ke JPEG untuk konsistensi
 */
const processImages = async (req, res, next) => {
    if (!req.files || req.files.length === 0) {
        return next();
    }

    try {
        const processedFiles = [];

        for (const file of req.files) {
            const originalPath = file.path;
            const ext = path.extname(file.originalname).toLowerCase();

            // Skip jika bukan gambar
            if (!['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
                processedFiles.push(file);
                continue;
            }

            // Generate nama file baru
            const newFilename = `optimized-${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`;
            const outputPath = path.join(path.dirname(originalPath), newFilename);

            // Process gambar dengan sharp
            await sharp(originalPath)
                .resize({
                    width: 800,
                    height: 800,
                    fit: 'inside', // Maintain aspect ratio
                    withoutEnlargement: true // Don't upscale small images
                })
                .jpeg({
                    quality: 80,
                    progressive: true
                })
                .toFile(outputPath);

            // Hapus file original
            try {
                fs.unlinkSync(originalPath);
            } catch (err) {
                console.warn('Could not delete original file:', err.message);
            }

            // Update file info
            const stats = fs.statSync(outputPath);
            processedFiles.push({
                ...file,
                filename: newFilename,
                path: outputPath,
                size: stats.size
            });

            console.log(`✅ Image optimized: ${file.originalname} -> ${newFilename} (${Math.round(stats.size / 1024)}KB)`);
        }

        req.files = processedFiles;
        next();
    } catch (error) {
        console.error('❌ Image processing error:', error);
        // Continue even if processing fails - use original files
        next();
    }
};

/**
 * Optimasi gambar tunggal (untuk base64 atau URL)
 */
const optimizeImageBuffer = async (buffer, options = {}) => {
    const { maxWidth = 800, quality = 80 } = options;

    try {
        const optimized = await sharp(buffer)
            .resize({
                width: maxWidth,
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({
                quality,
                progressive: true
            })
            .toBuffer();

        return optimized;
    } catch (error) {
        console.error('Image optimization error:', error);
        return buffer; // Return original if optimization fails
    }
};

module.exports = {
    processImages,
    optimizeImageBuffer
};
