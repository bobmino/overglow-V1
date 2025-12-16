import path from 'path';
import multer from 'multer';
import { compressImageBuffer } from '../utils/imageCompression.js';

// Use memory storage for Vercel (read-only filesystem)
// In production, images should be uploaded to Cloudinary/S3
const storage = multer.memoryStorage();

// Post-processing: compress images after upload (memory storage)
const compressAfterUpload = async (req, res, next) => {
  if (req.files) {
    // Multiple files
    for (const file of req.files) {
      try {
        // Compress from buffer (memory storage)
        const compressedBuffer = await compressImageBuffer(file.buffer, {
          quality: 85,
          maxWidth: 1920,
          maxHeight: 1080,
          format: 'webp',
        });
        file.buffer = compressedBuffer;
        file.compressed = true;
        // Convert to base64 for storage (temporary solution for Vercel)
        file.dataUrl = `data:image/webp;base64,${compressedBuffer.toString('base64')}`;
      } catch (error) {
        console.error('Error compressing image:', error);
        // Fallback to base64 without compression
        if (file.buffer) {
          const mimeType = file.mimetype || 'image/jpeg';
          file.dataUrl = `data:${mimeType};base64,${file.buffer.toString('base64')}`;
        }
      }
    }
  } else if (req.file) {
    // Single file
    try {
      // Compress from buffer (memory storage)
      const compressedBuffer = await compressImageBuffer(req.file.buffer, {
        quality: 85,
        maxWidth: 1920,
        maxHeight: 1080,
        format: 'webp',
      });
      req.file.buffer = compressedBuffer;
      req.file.compressed = true;
      // Convert to base64 for storage (temporary solution for Vercel)
      req.file.dataUrl = `data:image/webp;base64,${compressedBuffer.toString('base64')}`;
    } catch (error) {
      console.error('Error compressing image:', error);
      // Fallback to base64 without compression
      if (req.file.buffer) {
        const mimeType = req.file.mimetype || 'image/jpeg';
        req.file.dataUrl = `data:${mimeType};base64,${req.file.buffer.toString('base64')}`;
      }
    }
  }
  next();
};

// Allowed MIME types (strict validation)
const allowedMimeTypes = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

// Allowed file extensions
const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

function checkFileType(file, cb) {
  const extname = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype.toLowerCase();

  // Check extension
  if (!allowedExtensions.includes(extname)) {
    return cb(new Error(`Extension non autorisée. Extensions autorisées: ${allowedExtensions.join(', ')}`));
  }

  // Check MIME type (more secure than extension alone)
  if (!allowedMimeTypes.includes(mimetype)) {
    return cb(new Error(`Type MIME non autorisé. Types autorisés: ${allowedMimeTypes.join(', ')}`));
  }

  // Additional check: extension should match MIME type
  const extensionMimeMap = {
    '.jpg': ['image/jpeg', 'image/jpg'],
    '.jpeg': ['image/jpeg', 'image/jpg'],
    '.png': ['image/png'],
    '.webp': ['image/webp'],
  };

  if (!extensionMimeMap[extname]?.includes(mimetype)) {
    return cb(new Error('Extension et type MIME ne correspondent pas'));
  }

  return cb(null, true);
}

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max per file
  },
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

// Export upload middleware and compression middleware
export { compressAfterUpload };
export default upload;
