import express from 'express';
import upload, { compressAfterUpload } from '../middleware/uploadMiddleware.js';
import { strictLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Single image upload with compression
router.post('/', strictLimiter, upload.single('image'), compressAfterUpload, (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded');
  }
  res.send(`/${req.file.path.replace(/\\/g, '/')}`);
});

// Multiple images upload with compression
router.post('/images', strictLimiter, upload.array('images', 10), compressAfterUpload, (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'No files uploaded' });
  }
  const urls = req.files.map(file => `/${file.path.replace(/\\/g, '/')}`);
  res.json({ urls, images: urls });
});

export default router;
