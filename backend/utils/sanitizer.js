/**
 * Utility functions for sanitizing user inputs
 */

/**
 * Sanitize string input (trim, escape HTML)
 * @param {string} input - Input string to sanitize
 * @returns {string} - Sanitized string
 */
export const sanitizeString = (input) => {
  if (typeof input !== 'string') {
    return input;
  }
  return input
    .trim()
    .replace(/[<>]/g, ''); // Remove < and > to prevent HTML injection
};

/**
 * Sanitize array of strings
 * @param {Array} input - Array of strings to sanitize
 * @returns {Array} - Sanitized array
 */
export const sanitizeStringArray = (input) => {
  if (!Array.isArray(input)) {
    return [];
  }
  return input.map(item => sanitizeString(String(item))).filter(item => item.length > 0);
};

/**
 * Sanitize object with string values
 * @param {Object} input - Object to sanitize
 * @returns {Object} - Sanitized object
 */
export const sanitizeObject = (input) => {
  if (typeof input !== 'object' || input === null) {
    return input;
  }
  
  const sanitized = {};
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = sanitizeStringArray(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

/**
 * Validate and sanitize email
 * @param {string} email - Email to validate
 * @returns {string|null} - Sanitized email or null if invalid
 */
export const sanitizeEmail = (email) => {
  if (typeof email !== 'string') {
    return null;
  }
  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed) ? trimmed : null;
};

/**
 * Sanitize URL
 * @param {string} url - URL to sanitize
 * @returns {string|null} - Sanitized URL or null if invalid
 */
export const sanitizeUrl = (url) => {
  if (typeof url !== 'string') {
    return null;
  }
  try {
    const urlObj = new URL(url);
    // Only allow http and https protocols
    if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
      return urlObj.toString();
    }
    return null;
  } catch {
    return null;
  }
};

