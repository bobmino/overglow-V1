/**
 * Utilitaire centralisé pour les URLs d'images.
 * La bascule backend / VPS se fait uniquement via VITE_API_URL dans le fichier .env
 */

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=800';

/**
 * Retourne la base URL de l'API configurée dans .env (sans slash final).
 */
export const getApiBaseUrl = () => {
  const url = import.meta.env.VITE_API_URL;
  if (!url || typeof url !== 'string') return '';
  return url.trim().replace(/\/$/, '');
};

/**
 * Image de secours affichée quand aucune image n'est disponible.
 */
export const getPlaceholderImage = () => PLACEHOLDER_IMAGE;

/**
 * Transforme un chemin relatif (/uploads/...) en URL absolue via VITE_API_URL.
 * Les URLs absolues (http, https, Cloudinary) et les data URI sont retournées telles quelles.
 */
export const formatImageUrl = (value) => {
  if (!value || typeof value !== 'string') return '';

  const trimmed = value.trim();
  if (!trimmed) return '';

  if (/^(https?:\/\/|data:image\/)/i.test(trimmed)) {
    return trimmed;
  }

  const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  const base = getApiBaseUrl();

  if (!base) {
    if (import.meta.env.DEV) {
      console.warn(
        '[formatImageUrl] VITE_API_URL non défini — chemin relatif non résolu:',
        normalizedPath
      );
    }
    return normalizedPath;
  }

  return `${base}${normalizedPath}`;
};

/**
 * formatImageUrl avec image de secours si la valeur est vide ou invalide.
 */
export const formatImageUrlWithFallback = (value, fallback = PLACEHOLDER_IMAGE) => {
  const formatted = formatImageUrl(value);
  return formatted || fallback;
};

/**
 * Applique formatImageUrl à un tableau d'images.
 */
export const formatImageUrls = (images) => {
  if (!Array.isArray(images)) return [];
  return images.map((img) => formatImageUrl(img)).filter(Boolean);
};

export default formatImageUrl;
