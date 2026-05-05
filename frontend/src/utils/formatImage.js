const BACKEND_BASE_URL = 'https://overglow-backend.vercel.app';

export const formatImageUrl = (value) => {
  if (!value || typeof value !== 'string') return '';

  const trimmed = value.trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${BACKEND_BASE_URL}${normalizedPath}`;
};

export default formatImageUrl;
