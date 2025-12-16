import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

/**
 * Compress and optimize image from buffer (for Vercel/memory storage)
 * @param {Buffer} inputBuffer - Image buffer
 * @param {Object} options - Compression options
 * @returns {Buffer} Compressed image buffer
 */
export const compressImageBuffer = async (inputBuffer, options = {}) => {
  const {
    quality = 85,
    maxWidth = 1920,
    maxHeight = 1080,
    format = 'webp',
  } = options;

  try {
    // Get image metadata
    const metadata = await sharp(inputBuffer).metadata();
    
    // Calculate resize dimensions
    let width = metadata.width;
    let height = metadata.height;
    
    if (width > maxWidth || height > maxHeight) {
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    // Compress and resize
    let pipeline = sharp(inputBuffer)
      .resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true,
      });

    if (format === 'webp') {
      pipeline = pipeline.webp({ quality });
    } else if (format === 'jpeg') {
      pipeline = pipeline.jpeg({ quality, mozjpeg: true });
    } else if (format === 'png') {
      pipeline = pipeline.png({ quality: Math.min(quality, 100), compressionLevel: 9 });
    }

    const compressedBuffer = await pipeline.toBuffer();
    return compressedBuffer;
  } catch (error) {
    console.error('Image compression error:', error);
    // Return original buffer if compression fails
    return inputBuffer;
  }
};

/**
 * Compress and optimize image
 * @param {String} inputPath - Path to input image
 * @param {Object} options - Compression options
 * @returns {String} Path to compressed image
 */
export const compressImage = async (inputPath, options = {}) => {
  const {
    quality = 85,
    maxWidth = 1920,
    maxHeight = 1080,
    format = 'webp', // webp, jpeg, png
  } = options;

  try {
    const ext = path.extname(inputPath).toLowerCase();
    const baseName = path.basename(inputPath, ext);
    const dir = path.dirname(inputPath);
    
    // Determine output format
    let outputFormat = format;
    if (format === 'webp' && !inputPath.toLowerCase().endsWith('.webp')) {
      // Convert to WebP if not already
      outputFormat = 'webp';
    } else if (ext === '.png') {
      // Keep PNG for transparency
      outputFormat = 'png';
    } else {
      outputFormat = 'jpeg';
    }

    const outputPath = path.join(dir, `${baseName}_compressed.${outputFormat === 'webp' ? 'webp' : outputFormat === 'png' ? 'png' : 'jpg'}`);

    // Get image metadata
    const metadata = await sharp(inputPath).metadata();
    
    // Calculate resize dimensions
    let width = metadata.width;
    let height = metadata.height;
    
    if (width > maxWidth || height > maxHeight) {
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    // Compress and resize
    let pipeline = sharp(inputPath)
      .resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true,
      });

    if (outputFormat === 'webp') {
      pipeline = pipeline.webp({ quality });
    } else if (outputFormat === 'jpeg') {
      pipeline = pipeline.jpeg({ quality, mozjpeg: true });
    } else if (outputFormat === 'png') {
      pipeline = pipeline.png({ quality: Math.min(quality, 100), compressionLevel: 9 });
    }

    await pipeline.toFile(outputPath);

    // Delete original if compression succeeded and file is smaller
    const originalStats = await fs.stat(inputPath);
    const compressedStats = await fs.stat(outputPath);
    
    if (compressedStats.size < originalStats.size) {
      await fs.unlink(inputPath);
      // Rename compressed file to original name
      const finalPath = path.join(dir, `${baseName}.${outputFormat === 'webp' ? 'webp' : outputFormat === 'png' ? 'png' : 'jpg'}`);
      await fs.rename(outputPath, finalPath);
      return finalPath;
    } else {
      // Keep original if compressed is larger
      await fs.unlink(outputPath);
      return inputPath;
    }
  } catch (error) {
    console.error('Image compression error:', error);
    // Return original path if compression fails
    return inputPath;
  }
};

/**
 * Generate multiple sizes for responsive images
 * @param {String} inputPath - Path to input image
 * @returns {Object} Object with paths to different sizes
 */
export const generateResponsiveImages = async (inputPath) => {
  const sizes = [
    { width: 400, suffix: 'small' },
    { width: 800, suffix: 'medium' },
    { width: 1200, suffix: 'large' },
    { width: 1920, suffix: 'xlarge' },
  ];

  const results = {};
  const ext = path.extname(inputPath).toLowerCase();
  const baseName = path.basename(inputPath, ext);
  const dir = path.dirname(inputPath);

  for (const size of sizes) {
    try {
      const outputPath = path.join(dir, `${baseName}_${size.suffix}.webp`);
      await sharp(inputPath)
        .resize(size.width, null, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 85 })
        .toFile(outputPath);
      
      results[size.suffix] = outputPath.replace(/\\/g, '/');
    } catch (error) {
      console.error(`Error generating ${size.suffix} image:`, error);
    }
  }

  return results;
};

