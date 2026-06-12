const BACKEND_BASE_URL = 'https://overglow-backend.vercel.app';

export const formatImageUrl = (value) => {
  if (!value || typeof value !== 'string') return '';

  const trimmed = value.trim();
  if (!trimmed) return '';

  // URLs absolues (http, https, Cloudinary) ou data URI (upload sans Cloudinary)
  if (/^(https?:\/\/|data:image\/)/i.test(trimmed)) {
    return trimmed;
  }

  // Chemins relatifs servis par le backend (/uploads/...)
  const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${BACKEND_BASE_URL}${normalizedPath}`;
};

export default formatImageUrl;
