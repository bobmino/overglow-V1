import express from 'express';
import upload, { compressAfterUpload } from '../middleware/uploadMiddleware.js';
import { strictLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Single image upload with compression
router.post('/', strictLimiter, upload.single('image'), compressAfterUpload, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  
  // Return data URL for Vercel (read-only filesystem)
  // In production, this should be uploaded to Cloudinary/S3 and return a URL
  if (req.file.dataUrl) {
    return res.json({ url: req.file.dataUrl, message: 'Image uploaded successfully' });
  }
  
  // Fallback (should not happen)
  return res.status(500).json({ message: 'Error processing image' });
});

// Multiple images upload with compression
router.post('/images', strictLimiter, upload.array('images', 10), compressAfterUpload, (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'No files uploaded' });
  }
  
  // Return data URLs for Vercel (read-only filesystem)
  // In production, these should be uploaded to Cloudinary/S3 and return URLs
  const urls = req.files
    .filter(file => file.dataUrl)
    .map(file => file.dataUrl);
  
  if (urls.length === 0) {
    return res.status(500).json({ message: 'Error processing images' });
  }
  
  res.json({ urls, images: urls });
});

export default router;
