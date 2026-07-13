/**
 * HTML / text sanitization (Node + isomorphic-dompurify).
 * [TASK-19] Apply before persisting UGC to MongoDB.
 */
import createDOMPurify from 'isomorphic-dompurify';
import { logger } from './logger.js';

const DOMPurify = createDOMPurify();

const HTML_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'ul', 'ol', 'li',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'a', 'span',
    'div', 'img', 'figure', 'figcaption', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'code', 'pre', 'hr',
  ],
  ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'src', 'alt', 'width', 'height', 'class'],
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'link', 'style', 'svg', 'math'],
  FORBID_ATTR: ['style', 'onerror', 'onclick', 'onload', 'onmouseover'],
};

/** Rich HTML (product description, blog body). */
export const sanitizeHtml = (dirty) => {
  if (dirty == null) return '';
  if (typeof dirty !== 'string') return '';
  try {
    return DOMPurify.sanitize(dirty, HTML_CONFIG);
  } catch (err) {
    logger.warn('sanitizeHtml failed — falling back to strip tags', { message: err?.message });
    return String(dirty).replace(/<[^>]*>/g, '').trim();
  }
};

/** Plain text — no HTML. */
export const sanitizeText = (dirty) => {
  if (dirty == null) return '';
  if (typeof dirty !== 'string') return '';
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim();
};

export const sanitizeName = (dirty) => sanitizeText(dirty).slice(0, 200);

/**
 * Legacy helpers kept for callers that strip angle brackets on plain fields.
 */
export const sanitizeString = (input) => {
  if (typeof input !== 'string') return input;
  return sanitizeText(input);
};

export const sanitizeStringArray = (input) => {
  if (!Array.isArray(input)) return [];
  return input.map((item) => sanitizeText(String(item))).filter((item) => item.length > 0);
};

export const sanitizeObject = (input) => {
  if (typeof input !== 'object' || input === null) return input;
  const sanitized = {};
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === 'string') sanitized[key] = sanitizeText(value);
    else if (Array.isArray(value)) sanitized[key] = sanitizeStringArray(value);
    else if (typeof value === 'object' && value !== null) sanitized[key] = sanitizeObject(value);
    else sanitized[key] = value;
  }
  return sanitized;
};

export const sanitizeEmail = (email) => {
  if (typeof email !== 'string') return null;
  const trimmed = email.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) ? trimmed : null;
};

export const sanitizeUrl = (url) => {
  if (typeof url !== 'string') return null;
  try {
    const urlObj = new URL(url);
    if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') return urlObj.toString();
    return null;
  } catch {
    return null;
  }
};

export default {
  sanitizeHtml,
  sanitizeText,
  sanitizeName,
  sanitizeString,
  sanitizeStringArray,
  sanitizeObject,
  sanitizeEmail,
  sanitizeUrl,
};
