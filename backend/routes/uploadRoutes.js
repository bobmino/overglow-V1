import express from 'express';
import upload, { compressAfterUpload } from '../middleware/uploadMiddleware.js';
import { strictLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Single image upload with compression
router.post('/', strictLimiter, upload.single('image'), compressAfterUpload, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  
  // Return Cloudinary URL if available, otherwise data URL (base64)
  if (req.file.dataUrl) {
    const isCloudinaryUrl = req.file.dataUrl.startsWith('http');
    return res.json({ 
      url: req.file.dataUrl, 
      message: 'Image uploaded successfully',
      source: isCloudinaryUrl ? 'cloudinary' : 'base64'
    });
  }
  
  // Fallback (should not happen)
  return res.status(500).json({ message: 'Error processing image' });
});

// Multiple images upload with compression
router.post('/images', strictLimiter, upload.array('images', 10), compressAfterUpload, (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'No files uploaded' });
  }
  
  // Return Cloudinary URLs if available, otherwise data URLs (base64)
  const urls = req.files
    .filter(file => file.dataUrl)
    .map(file => file.dataUrl);
  
  if (urls.length === 0) {
    return res.status(500).json({ message: 'Error processing images' });
  }
  
  const source = urls[0]?.startsWith('http') ? 'cloudinary' : 'base64';
  
  res.json({ urls, images: urls, source });
});

export default router;
