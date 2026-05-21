import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

// Normalize roles to avoid issues with older data / accent variants
const normalizeRole = (role) => {
  if (!role) return role;
  const raw = String(role).trim();
  const lower = raw.toLowerCase();

  // Admin variants
  if (lower === 'admin' || lower === 'administrator' || lower === 'superadmin') return 'Admin';

  // Operator variants (accent + english)
  if (lower === 'opérateur' || lower === 'operateur' || lower === 'operator') return 'Opérateur';

  // Client variants
  if (lower === 'client' || lower === 'user' || lower === 'customer' || lower === 'voyageur') return 'Client';

  return raw;
};

// Helper to set CORS headers
const setCORSHeaders = (req, res) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://overglow-v1-3jqp.vercel.app',
    'https://overglow-v1.vercel.app',
    'https://overglow-frontend.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5174',
  ];
  
  if (origin && (allowedOrigins.includes(origin) || origin.includes('vercel.app') || origin.includes('localhost'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
};

const parseCookies = (req) => {
  const rawCookie = req.headers?.cookie;
  if (!rawCookie) return {};
  return rawCookie.split(';').reduce((acc, part) => {
    const [rawKey, ...rest] = part.trim().split('=');
    if (!rawKey) return acc;
    acc[rawKey] = decodeURIComponent(rest.join('='));
    return acc;
  }, {});
};

const protect = async (req, res, next) => {
  // Always set CORS headers first
  setCORSHeaders(req, res);
  
  // Check if JWT_SECRET is configured
  if (!process.env.JWT_SECRET) {
    console.error('Protect middleware error: JWT_SECRET is not defined in environment variables');
    res.status(500);
    return next(new Error('Server configuration error. JWT_SECRET missing'));
  }

  let token;
  const cookies = parseCookies(req);
  const cookieToken = cookies.accessToken;

  if (cookieToken) {
    token = cookieToken;
  }

  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    return next(new Error('Not authorized, no token'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type && decoded.type !== 'access') {
      res.status(401);
      return next(new Error('Invalid token type. Access token required.'));
    }

    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      res.status(401);
      return next(new Error('User not found'));
    }

    req.user.role = normalizeRole(req.user.role);

    // Keep existing account lock checks for backward compatibility
    if (req.user.lockedUntil && req.user.lockedUntil > new Date()) {
      res.status(403);
      return next(new Error(`Account locked until ${req.user.lockedUntil.toISOString()}. Too many failed login attempts.`));
    }

    if (req.user.lockedUntil && req.user.lockedUntil <= new Date()) {
      req.user.lockedUntil = undefined;
      req.user.failedLoginAttempts = 0;
      await req.user.save();
    }

    return next();
  } catch (error) {
    res.status(401);
    return next(new Error('Not authorized, token failed'));
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    // Always set CORS headers first
    setCORSHeaders(req, res);
    
    if (!req.user) {
      res.status(401);
      return next(new Error('User not authenticated'));
    }
    
    const userRole = normalizeRole(req.user.role);
    if (!roles.includes(userRole)) {
      res.status(403);
      return next(new Error(`User role ${userRole} is not authorized to access this route`));
    }
    next();
  };
};

// @desc    Optional authentication - sets req.user if token is valid, but doesn't block if missing
// @usage   Used for endpoints that work with or without auth (e.g., checkFavorite during checkout)
const optionalAuth = async (req, res, next) => {
  setCORSHeaders(req, res);
  
  let token;
  const cookies = parseCookies(req);
  const cookieToken = cookies.accessToken;

  if (cookieToken) {
    token = cookieToken;
  }

  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    // No token provided, continue without user context
    req.user = null;
    return next();
  }

  try {
    if (!process.env.JWT_SECRET) {
      req.user = null;
      return next();
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type && decoded.type !== 'access') {
      req.user = null;
      return next();
    }

    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      req.user = null;
    } else {
      req.user.role = normalizeRole(req.user.role);
    }
  } catch (error) {
    // Token is invalid or expired, continue without user context
    req.user = null;
  }
  
  return next();
};

export { protect, authorize, optionalAuth };
