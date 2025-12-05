import express from 'express';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Single image upload
router.post('/', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded');
  }
  res.send(`/${req.file.path.replace(/\\/g, '/')}`);
});

// Multiple images upload
router.post('/images', upload.array('images', 10), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'No files uploaded' });
  }
  const urls = req.files.map(file => `/${file.path.replace(/\\/g, '/')}`);
  res.json({ urls, images: urls });
});

export default router;
