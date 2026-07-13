/**
 * [TASK-23] Mass-assignment protection for user update payloads.
 * Strips forbidden fields before controllers apply changes.
 */
import { logger } from '../utils/logger.js';

/** Fields a regular user (Client / Opérateur) may update on their own profile. */
export const USER_SELF_UPDATE_FIELDS = [
  'name',
  'email',
  'phone',
  'password',
  'preferences',
  'avatar',
  'bio',
  'location',
  'dateOfBirth',
  'website',
  'socialLinks',
];

/** Extra fields an Admin may set when updating a user (never identity / hash). */
export const ADMIN_USER_UPDATE_EXTRA = [
  'role',
  'isApproved',
  'approvedAt',
  'loyaltyPoints',
  'loyaltyLevel',
];

/** Always stripped — never writable via API body. */
export const USER_UPDATE_DENIED = [
  '_id',
  'id',
  'passwordHash',
  'passwordhash',
  'createdAt',
  'updatedAt',
  'isAdmin',
  'isVerified',
  'refreshTokens',
  'failedLoginAttempts',
  'lockedUntil',
  'lastLoginAt',
  'lastLoginIp',
  'totalSpent',
  'totalBookings',
  'loyaltyPointsHistory',
  '__v',
];

const normalizeRole = (role) => {
  if (!role) return 'Client';
  const lower = String(role).trim().toLowerCase();
  if (lower === 'admin' || lower === 'administrator' || lower === 'superadmin') return 'Admin';
  if (['opérateur', 'operateur', 'operator', 'provider', 'prestataire', 'partenaire'].includes(lower)) {
    return 'Opérateur';
  }
  return 'Client';
};

/**
 * Pick only allowlisted keys from body.
 * @param {object} body
 * @param {string[]} allow
 */
export const pickAllowedFields = (body = {}, allow = []) => {
  const out = {};
  for (const key of allow) {
    if (Object.prototype.hasOwnProperty.call(body, key) && body[key] !== undefined) {
      out[key] = body[key];
    }
  }
  return out;
};

/**
 * Middleware: replace req.body with allowlisted fields for self-profile updates.
 * Blocks role elevation and identity fields for non-admin self-updates.
 */
export const userSelfUpdateAllowlist = (req, res, next) => {
  const role = normalizeRole(req.user?.role);
  const deniedHit = USER_UPDATE_DENIED.filter((k) =>
    Object.prototype.hasOwnProperty.call(req.body || {}, k)
  );

  // Non-admin cannot touch admin-only or denied fields
  const attemptedRole = Object.prototype.hasOwnProperty.call(req.body || {}, 'role');
  if (role !== 'Admin' && (deniedHit.length || attemptedRole)) {
    logger.warn('userSelfUpdateAllowlist: stripped forbidden fields', {
      userId: req.user?._id?.toString(),
      deniedHit,
      attemptedRole,
    });
  }

  const allow =
    role === 'Admin'
      ? [...USER_SELF_UPDATE_FIELDS, ...ADMIN_USER_UPDATE_EXTRA]
      : USER_SELF_UPDATE_FIELDS;

  // Self profile: even Admin cannot set _id / passwordHash via this route
  const safeAllow = allow.filter((k) => !USER_UPDATE_DENIED.includes(k));
  req.body = pickAllowedFields(req.body, safeAllow);
  next();
};

/**
 * Middleware for admin updating another user: broader allowlist, still no _id/passwordHash.
 */
export const adminUserUpdateAllowlist = (req, res, next) => {
  const allow = [...USER_SELF_UPDATE_FIELDS, ...ADMIN_USER_UPDATE_EXTRA].filter(
    (k) => !USER_UPDATE_DENIED.includes(k)
  );
  const deniedHit = USER_UPDATE_DENIED.filter((k) =>
    Object.prototype.hasOwnProperty.call(req.body || {}, k)
  );
  if (deniedHit.length) {
    logger.warn('adminUserUpdateAllowlist: stripped denied fields', {
      adminId: req.user?._id?.toString(),
      deniedHit,
    });
  }
  req.body = pickAllowedFields(req.body, allow);
  next();
};

export default {
  USER_SELF_UPDATE_FIELDS,
  ADMIN_USER_UPDATE_EXTRA,
  USER_UPDATE_DENIED,
  pickAllowedFields,
  userSelfUpdateAllowlist,
  adminUserUpdateAllowlist,
};
