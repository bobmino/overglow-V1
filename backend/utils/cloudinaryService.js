import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload image buffer to Cloudinary
 * @param {Buffer} buffer - Image buffer
 * @param {Object} options - Upload options
 * @returns {Promise<String>} Cloudinary URL
 */
export const uploadToCloudinary = async (buffer, options = {}) => {
  const {
    folder = 'overglow-trip',
    publicId = null,
    transformation = {
      quality: 'auto',
      fetch_format: 'auto',
      width: 1920,
      height: 1080,
      crop: 'limit',
    },
  } = options;

  return new Promise((resolve, reject) => {
    // Convert buffer to data URI for Cloudinary
    const base64String = buffer.toString('base64');
    const dataUri = `data:image/webp;base64,${base64String}`;

    // Upload using upload_stream with data URI
    cloudinary.uploader.upload(
      dataUri,
      {
        folder,
        public_id: publicId,
        transformation,
        resource_type: 'image',
        format: 'webp',
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          resolve(result.secure_url);
        }
      }
    );
  });
};

/**
 * Delete image from Cloudinary
 * @param {String} url - Cloudinary URL or public ID
 * @returns {Promise<Object>} Deletion result
 */
export const deleteFromCloudinary = async (url) => {
  try {
    // Extract public_id from URL
    const publicId = extractPublicId(url);
    if (!publicId) {
      throw new Error('Invalid Cloudinary URL');
    }

    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
};

/**
 * Extract public_id from Cloudinary URL
 * @param {String} url - Cloudinary URL
 * @returns {String|null} Public ID
 */
const extractPublicId = (url) => {
  if (!url || typeof url !== 'string') return null;
  
  // If it's already a public_id (no http), return as is
  if (!url.startsWith('http')) return url;
  
  // Extract from URL pattern: https://res.cloudinary.com/{cloud_name}/image/upload/{version}/{public_id}.{format}
  const match = url.match(/\/v\d+\/(.+)\.(jpg|jpeg|png|webp|gif)/i);
  if (match) {
    return match[1];
  }
  
  // Try to extract from folder structure
  const folderMatch = url.match(/\/upload\/(.+?)\.(jpg|jpeg|png|webp|gif)/i);
  if (folderMatch) {
    return folderMatch[1];
  }
  
  return null;
};

/**
 * Check if Cloudinary is configured
 * @returns {Boolean}
 */
export const isCloudinaryConfigured = () => {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

export default cloudinary;

