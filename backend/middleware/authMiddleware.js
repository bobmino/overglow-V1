import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

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

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check token type (should be 'access' or undefined for backward compatibility)
      if (decoded.type && decoded.type !== 'access') {
        res.status(401);
        return next(new Error('Invalid token type. Access token required.'));
      }

      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        res.status(401);
        return next(new Error('User not found'));
      }
      
      // Check if account is locked
      if (req.user.lockedUntil && req.user.lockedUntil > new Date()) {
        res.status(403);
        return next(new Error(`Account locked until ${req.user.lockedUntil.toISOString()}. Too many failed login attempts.`));
      }
      
      // Unlock account if lock period has passed
      if (req.user.lockedUntil && req.user.lockedUntil <= new Date()) {
        req.user.lockedUntil = undefined;
        req.user.failedLoginAttempts = 0;
        await req.user.save();
      }

      next();
    } catch (error) {
      console.error('Protect middleware error:', {
        message: error.message,
        name: error.name,
        path: req.path
      });
      res.status(401);
      return next(new Error('Not authorized, token failed'));
    }
  }

  if (!token) {
    res.status(401);
    return next(new Error('Not authorized, no token'));
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
    
    if (!roles.includes(req.user.role)) {
      res.status(403);
      return next(new Error(`User role ${req.user.role} is not authorized to access this route`));
    }
    next();
  };
};

export { protect, authorize };
