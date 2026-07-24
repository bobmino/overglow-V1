import express from 'express';
import upload, { compressAfterUpload, uploadCsv, uploadDocument } from '../middleware/uploadMiddleware.js';
import { strictLimiter } from '../middleware/rateLimiter.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { sanitizeCsvRows } from '../utils/csvSanitize.js';
import { isLocalStorageEnabled, saveBufferToUploads } from '../utils/localStorageService.js';
import crypto from 'crypto';
import path from 'path';

const router = express.Router();

const PRODUCT_CSV_COLUMNS = [
  'title',
  'description',
  'price',
  'city',
  'category',
  'address',
  'duration',
  'imageUrl',
];

// [TASK-1/9] Uploads images authentifiés (opérateur / admin)
router.post(
  '/',
  protect,
  authorize('Opérateur', 'Admin'),
  strictLimiter,
  upload.single('image'),
  compressAfterUpload,
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    if (req.file.dataUrl) {
      const source =
        req.file.storageSource
        || (req.file.dataUrl.startsWith('http')
          ? 'cloudinary'
          : req.file.dataUrl.startsWith('/uploads')
            ? 'local'
            : 'base64');
      return res.json({
        url: req.file.dataUrl,
        filename: req.file.storedName,
        message: 'Image uploaded successfully',
        source,
      });
    }

    return res.status(500).json({ message: 'Error processing image' });
  }
);

// [PROMPT-6] Chat attachments — any authenticated user
router.post(
  '/chat',
  protect,
  strictLimiter,
  upload.single('image'),
  compressAfterUpload,
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    if (req.file.dataUrl) {
      return res.json({
        url: req.file.dataUrl,
        filename: req.file.originalname || req.file.storedName,
        message: 'Chat file uploaded successfully',
      });
    }
    return res.status(500).json({ message: 'Error processing image' });
  }
);

router.post(
  '/images',
  protect,
  authorize('Opérateur', 'Admin'),
  strictLimiter,
  upload.array('images', 10),
  compressAfterUpload,
  (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const urls = req.files.filter((file) => file.dataUrl).map((file) => file.dataUrl);
    if (urls.length === 0) {
      return res.status(500).json({ message: 'Error processing images' });
    }

    const first = req.files.find((f) => f.dataUrl);
    const source =
      first?.storageSource
      || (urls[0]?.startsWith('http')
        ? 'cloudinary'
        : urls[0]?.startsWith('/uploads')
          ? 'local'
          : 'base64');
    res.json({
      urls,
      images: urls,
      filenames: req.files.map((f) => f.storedName).filter(Boolean),
      source,
    });
  }
);

/**
 * [TASK-9] Bulk CSV upload — Admin only.
 * Attend un fichier .csv; parse basique UTF-8 (colonnes séparées par virgule).
 */
router.post(
  '/csv',
  protect,
  authorize('Admin'),
  strictLimiter,
  uploadCsv.single('file'),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No CSV file uploaded' });
    }

    try {
      const text = req.file.buffer.toString('utf8').replace(/^\uFEFF/, '');
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        return res.status(400).json({ message: 'CSV must include a header and at least one row' });
      }

      const headers = lines[0].split(',').map((h) => h.trim());
      const extras = headers.filter((h) => !PRODUCT_CSV_COLUMNS.includes(h));
      if (extras.length) {
        return res.status(400).json({
          message: 'Unexpected CSV columns rejected',
          extras,
          allowed: PRODUCT_CSV_COLUMNS,
        });
      }

      const rows = lines.slice(1).map((line) => {
        const cols = line.split(',');
        const row = {};
        headers.forEach((h, i) => {
          row[h] = (cols[i] || '').trim();
        });
        return row;
      });

      const result = sanitizeCsvRows(rows, PRODUCT_CSV_COLUMNS, { maxRows: 1000 });
      if (!result.ok) {
        return res.status(400).json({ message: 'CSV validation failed', errors: result.errors });
      }

      return res.status(200).json({
        message: 'CSV validated and sanitized',
        count: result.rows.length,
        rows: result.rows,
        filename: `${crypto.randomUUID()}${path.extname(req.file.originalname || '.csv')}`,
      });
    } catch (error) {
      return res.status(400).json({ message: 'Failed to parse CSV', error: error.message });
    }
  }
);

/**
 * [TASK-9] Document upload — Opérateur / Admin (pdf/doc/docx, 10MB).
 */
router.post(
  '/document',
  protect,
  authorize('Admin', 'Opérateur'),
  strictLimiter,
  uploadDocument.single('document'),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No document uploaded' });
    }

    const storedName = `${crypto.randomUUID()}${path.extname(req.file.originalname || '').toLowerCase()}`;

    if (isLocalStorageEnabled()) {
      try {
        const saved = await saveBufferToUploads(req.file.buffer, storedName, 'documents');
        return res.status(200).json({
          message: 'Document uploaded successfully',
          url: saved.url,
          filename: saved.filename,
          size: req.file.size,
          mimetype: req.file.mimetype,
          source: 'local',
        });
      } catch (err) {
        return res.status(500).json({ message: 'Failed to store document', error: err.message });
      }
    }

    return res.status(200).json({
      message: 'Document accepted (metadata only — set STORAGE_DRIVER=local to persist)',
      filename: storedName,
      size: req.file.size,
      mimetype: req.file.mimetype,
      source: 'metadata',
    });
  }
);

export default router;
