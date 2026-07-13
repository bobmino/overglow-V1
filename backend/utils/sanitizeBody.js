/**
 * [TASK-6] Protection mass-assignment — allowlist des champs acceptés.
 */

/** Champs sensibles toujours exclus (sauf endpoints password dédiés). */
export const BLOCKED_FIELDS = Object.freeze([
  'role',
  'isAdmin',
  'admin',
  '_id',
  '__v',
  'password',
  'passwordHash',
  'resetPasswordToken',
  'resetPasswordExpire',
  'failedLoginAttempts',
  'lockedUntil',
  'emailVerified',
  'stripeCustomerId',
  'createdAt',
  'updatedAt',
]);

/**
 * Ne conserve que les clés autorisées, et retire les champs bloqués.
 * @param {object} body
 * @param {string[]} allowedFields
 * @returns {object}
 */
export const sanitizeBody = (body, allowedFields = []) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return {};
  }

  const allow = new Set(allowedFields);
  const sanitized = {};

  for (const [key, value] of Object.entries(body)) {
    if (BLOCKED_FIELDS.includes(key)) continue;
    if (!allow.has(key)) continue;
    sanitized[key] = value;
  }

  return sanitized;
};

export default { sanitizeBody, BLOCKED_FIELDS };
