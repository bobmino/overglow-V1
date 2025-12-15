import path from 'path';
import multer from 'multer';

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

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

export default upload;
