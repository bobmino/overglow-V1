import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
import { compressImageBuffer } from '../utils/imageCompression.js';
import { uploadToCloudinary, isCloudinaryConfigured } from '../utils/cloudinaryService.js';
import { isAllowedCsvUpload } from '../utils/csvSanitize.js';
import { logger } from '../utils/logger.js';

// Use memory storage for Vercel (read-only filesystem)
const storage = multer.memoryStorage();

/**
 * [TASK-9] Vérifie les magic bytes (signatures fichier) — anti spoofing MIME.
 */
export const validateImageMagicBytes = (buffer) => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return false;
  // JPEG
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return true;
  // PNG
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return true;
  // GIF
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) return true;
  // WEBP (RIFF....WEBP)
  if (
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46
    && buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    return true;
  }
  return false;
};

const assignUniqueFilename = (file) => {
  const ext = path.extname(file.originalname || '').toLowerCase() || '.bin';
  file.storedName = `${crypto.randomUUID()}${ext}`;
};

// Post-processing: compress and upload images (memory storage)
const compressAfterUpload = async (req, res, next) => {
  const useCloudinary = isCloudinaryConfigured();

  const processOne = async (file) => {
    assignUniqueFilename(file);

    // [TASK-9] Signature binaire obligatoire
    if (!validateImageMagicBytes(file.buffer)) {
      const err = new Error('Signature de fichier image invalide');
      err.statusCode = 400;
      throw err;
    }

    try {
      const compressedBuffer = await compressImageBuffer(file.buffer, {
        quality: 85,
        maxWidth: 1920,
        maxHeight: 1080,
        format: 'webp',
      });
      file.buffer = compressedBuffer;
      file.compressed = true;

      if (useCloudinary) {
        try {
          const cloudinaryUrl = await uploadToCloudinary(compressedBuffer, {
            folder: 'overglow-trip/uploads',
            public_id: path.parse(file.storedName).name,
          });
          file.cloudinaryUrl = cloudinaryUrl;
          file.dataUrl = cloudinaryUrl;
        } catch (cloudinaryError) {
          logger.error('Cloudinary upload failed, falling back to base64:', cloudinaryError);
          file.dataUrl = `data:image/webp;base64,${compressedBuffer.toString('base64')}`;
        }
      } else {
        file.dataUrl = `data:image/webp;base64,${compressedBuffer.toString('base64')}`;
      }
    } catch (error) {
      logger.error('Error compressing image:', error);
      if (file.buffer) {
        const mimeType = file.mimetype || 'image/jpeg';
        file.dataUrl = `data:${mimeType};base64,${file.buffer.toString('base64')}`;
      }
    }
  };

  try {
    if (req.files) {
      for (const file of req.files) {
        await processOne(file);
      }
    } else if (req.file) {
      await processOne(req.file);
    }
    return next();
  } catch (error) {
    const status = error.statusCode || 400;
    return res.status(status).json({ message: error.message || 'Upload rejected' });
  }
};

// Allowed MIME types (strict validation) — images only
const allowedMimeTypes = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];

const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

function checkFileType(file, cb) {
  const extname = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype.toLowerCase();

  if (!allowedExtensions.includes(extname)) {
    return cb(new Error(`Extension non autorisée. Extensions autorisées: ${allowedExtensions.join(', ')}`));
  }

  if (!allowedMimeTypes.includes(mimetype)) {
    return cb(new Error(`Type MIME non autorisé. Types autorisés: ${allowedMimeTypes.join(', ')}`));
  }

  const extensionMimeMap = {
    '.jpg': ['image/jpeg', 'image/jpg'],
    '.jpeg': ['image/jpeg', 'image/jpg'],
    '.png': ['image/png'],
    '.webp': ['image/webp'],
    '.gif': ['image/gif'],
  };

  if (!extensionMimeMap[extname]?.includes(mimetype)) {
    return cb(new Error('Extension et type MIME ne correspondent pas'));
  }

  return cb(null, true);
}

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max per image
  },
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

/** [TASK-9] Upload CSV/XLSX admin (5MB) */
export const uploadCsv = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!isAllowedCsvUpload(file)) {
      return cb(new Error('Seuls les fichiers .csv / .xlsx sont autorisés'));
    }
    return cb(null, true);
  },
});

/** Documents PDF/DOC (10MB) — auth admin côté route */
export const uploadDocument = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const mime = (file.mimetype || '').toLowerCase();
    const okExt = ['.pdf', '.doc', '.docx'].includes(ext);
    const okMime = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ].includes(mime);
    if (!okExt || !okMime) {
      return cb(new Error('Documents autorisés: pdf, doc, docx'));
    }
    return cb(null, true);
  },
});

export { compressAfterUpload };
export default upload;
