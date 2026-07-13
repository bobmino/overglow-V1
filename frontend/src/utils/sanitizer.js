/**
 * HTML sanitization with DOMPurify (browser).
 * Safe tags only — strips script/iframe/object/embed and event handlers.
 */
import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'a', 'span',
  'div', 'img', 'figure', 'figcaption', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'code', 'pre', 'hr',
];

const ALLOWED_ATTR = [
  'href', 'title', 'target', 'rel', 'src', 'alt', 'width', 'height', 'class',
];

const HTML_CONFIG = {
  ALLOWED_TAGS,
  ALLOWED_ATTR,
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'link', 'style', 'svg', 'math'],
  FORBID_ATTR: ['style', 'onerror', 'onclick', 'onload', 'onmouseover'],
};

/** Sanitize rich HTML (blog, product description HTML). */
export const sanitizeHtml = (dirty) => {
  if (dirty == null) return '';
  if (typeof dirty !== 'string') return '';
  return DOMPurify.sanitize(dirty, HTML_CONFIG);
};

/** Plain text: strip all tags. */
export const sanitizeText = (dirty) => {
  if (dirty == null) return '';
  if (typeof dirty !== 'string') return '';
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim();
};

/** Safe name / short label. */
export const sanitizeName = (dirty) => sanitizeText(dirty).slice(0, 200);

export default { sanitizeHtml, sanitizeText, sanitizeName };
