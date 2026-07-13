import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import Operator from '../models/operatorModel.js';
import generateToken, { generateAccessToken, generateRefreshToken } from '../../utils/generateToken.js';
import { validationResult } from 'express-validator';
import { notifyOperatorRegistered } from '../utils/notificationService.js';
import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';
import { randomBytes } from 'crypto';
import { sendWelcomeEmail } from '../utils/emailService.js';
import connectDB from '../../config/db.js';
import { setCORSHeaders } from '../config/cors.js';
import { sanitizeText, sanitizeName } from '../utils/sanitizer.js';


// Normalize roles to avoid issues with older data / accent variants
const normalizeRole = (role) => {
  if (!role) return role;
  const raw = String(role).trim();
  const lower = raw.toLowerCase();
  if (lower === 'admin' || lower === 'administrator' || lower === 'superadmin') return 'Admin';
  if (lower === 'opérateur' || lower === 'operateur' || lower === 'operator' || lower === 'provider' || lower === 'prestataire' || lower === 'partenaire') return 'Opérateur';
  if (lower === 'client' || lower === 'user' || lower === 'customer' || lower === 'voyageur') return 'Client';
  return raw;
};

const getCookieOptions = (isRefreshToken = false) => ({
  httpOnly: true,
  // CORRECTION: En production Vercel, secure doit être true pour sameSite: 'none'
  // Mais on utilise 'lax' pour éviter les problèmes de cookies cross-site
  secure: process.env.NODE_ENV === 'production' || process.env.VERCEL,
  sameSite: 'lax', // Utiliser 'lax' au lieu de 'none' pour compatibilité Vercel
  path: '/',
  maxAge: isRefreshToken ? 7 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000,
});

const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie('accessToken', accessToken, getCookieOptions(false));
  res.cookie('refreshToken', refreshToken, getCookieOptions(true));
};

const clearAuthCookies = (res) => {
  res.clearCookie('accessToken', getCookieOptions(false));
  res.clearCookie('refreshToken', getCookieOptions(true));
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

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  // Always set CORS headers first
  setCORSHeaders(req, res);
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role, companyName, description } = req.body;
    const trimmedEmail = String(email || '').trim();

    const userExists = await User.findOne({ email: { $regex: new RegExp(`^${trimmedEmail}$`, 'i') } });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Default role is 'Client' (not 'Voyageur')
    const finalRole = normalizeRole(role || 'Client');
    
    const user = await User.create({
      name,
      email: trimmedEmail,
      password,
      role: finalRole,
      // Clients are auto-approved, operators need approval
      isApproved: finalRole === 'Client',
      approvedAt: finalRole === 'Client' ? new Date() : undefined,
    });

    if (user) {
      if (finalRole === 'Opérateur') {
        const operator = await Operator.create({
          user: user._id,
          companyName: companyName || `${name}'s Company`,
          description: description || '',
          status: 'Pending', // Operators start as Pending
        });
        
        // Notify all admins of new operator registration
        const adminUsers = await User.find({ role: 'Admin' });
        const adminIds = adminUsers.map(admin => admin._id);
        if (adminIds.length > 0) {
          await notifyOperatorRegistered(operator, adminIds);
        }
      }

      // Generate tokens
      const accessToken = generateAccessToken(user._id, user.role);
      const refreshToken = generateRefreshToken(user._id, user.role);
      
      // Store refresh token in user document
      const refreshTokenExpiry = new Date();
      refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7); // 7 days
      
      user.refreshTokens.push({
        token: refreshToken,
        expiresAt: refreshTokenExpiry,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
      });
      await user.save();
      
      // Send welcome email (non-blocking)
      sendWelcomeEmail(user).catch(err => logger.error('Failed to send welcome email:', err));

      setAuthCookies(res, accessToken, refreshToken);

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: accessToken,
        refreshToken: refreshToken,
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// @desc    Partner pre-signup (provider funnel)
// @route   POST /api/auth/partner-signup
// @access  Public
const partnerSignup = async (req, res) => {
  setCORSHeaders(req, res);

  try {
    const { name, activityType, city, whatsapp } = req.body;

    if (!name || !activityType || !city || !whatsapp) {
      return res.status(400).json({ success: false, message: 'Champs requis manquants' });
    }

    const normalizedWhatsapp = String(whatsapp).replace(/\s+/g, '').trim();
    const existingByPhone = await User.findOne({ phone: normalizedWhatsapp });
    if (existingByPhone) {
      return res.status(400).json({ success: false, message: 'Ce numero WhatsApp est deja inscrit' });
    }

    const syntheticEmail = `partner_${Date.now()}_${Math.floor(Math.random() * 1000)}@partners.overglow.local`;
    const tempPassword = randomBytes(12).toString('hex');

    const user = await User.create({
      name,
      email: syntheticEmail,
      password: tempPassword,
      role: 'Opérateur',
      phone: normalizedWhatsapp,
      location: city,
      bio: `Type d'activite: ${activityType}`,
      isApproved: false,
    });

    await Operator.create({
      user: user._id,
      companyName: activityType,
      description: `Partenaire en pre-inscription (${activityType})`,
      location: { city },
      status: 'Pending',
    });

    const { sendOperatorOnboardingPendingEmail } = await import('../utils/emailService.js');
    sendOperatorOnboardingPendingEmail(user).catch(err => logger.error('Failed to send onboarding pending email:', err));

    return res.status(201).json({
      success: true,
      message: 'Pre-inscription enregistree. Notre equipe vous contactera rapidement.',
    });
  } catch (error) {
    logger.error('Partner signup error', {
      message: error?.message,
      stack: error?.stack,
    });
    return res.status(500).json({ success: false, message: 'Service momentanement indisponible' });
  }
};

// @desc    Upgrade existing user to operator
// @route   POST /api/auth/upgrade-to-operator
// @access  Private
const upgradeToOperator = async (req, res) => {
  setCORSHeaders(req, res);

  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'Opérateur') {
      return res.status(400).json({ message: 'User is already an operator' });
    }

    // Upgrade role
    user.role = 'Opérateur';
    await user.save();

    // Create Operator profile if it doesn't exist
    let operator = await Operator.findOne({ user: user._id });
    if (!operator) {
      operator = await Operator.create({
        user: user._id,
        companyName: user.name || 'My Company',
        description: 'New Operator Profile',
        status: 'Pending',
      });
    }

    const { sendOperatorOnboardingPendingEmail } = await import('../utils/emailService.js');
    sendOperatorOnboardingPendingEmail(user).catch(err => logger.error('Failed to send onboarding pending email:', err));

    // Issue new token with updated role
    const accessToken = generateAccessToken(user._id, user.role);
    res.cookie('accessToken', accessToken, getCookieOptions(false));

    res.json({
      message: 'Successfully upgraded to operator',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: accessToken
      }
    });
  } catch (error) {
    logger.error('Upgrade to operator error', {
      message: error?.message,
      stack: error?.stack,
    });
    res.status(500).json({ message: 'Server error during upgrade' });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  // Always set CORS headers first
  setCORSHeaders(req, res);
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check if JWT_SECRET is configured
    if (!process.env.JWT_SECRET) {
      logger.error('Login error: JWT_SECRET is not defined in environment variables');
      return res.status(500).json({ 
        message: 'Server configuration error. Please contact support.',
        error: 'JWT_SECRET missing'
      });
    }

    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      logger.error('Login error: Database not connected', { 
        readyState: mongoose.connection.readyState,
        states: {
          0: 'disconnected',
          1: 'connected',
          2: 'connecting',
          3: 'disconnecting'
        }
      });
      // Try to reconnect
      try {
        await connectDB();
        // Wait a bit for connection to establish
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check again after waiting
        if (mongoose.connection.readyState !== 1) {
          logger.error('Login error: Database still not connected after retry', { 
            readyState: mongoose.connection.readyState 
          });
          return res.status(500).json({ 
            message: 'Database connection error. Please try again later.',
            error: 'Database unavailable'
          });
        }
      } catch (dbError) {
        logger.error('Database reconnection failed:', {
          message: dbError.message,
          stack: dbError.stack,
          name: dbError.name
        });
        return res.status(500).json({ 
          message: 'Database connection error. Please try again later.',
          error: 'Database unavailable'
        });
      }
    }

    // Find user
    const trimmedEmail = String(email || '').trim();
    let user;
    try {
      user = await User.findOne({ email: { $regex: new RegExp(`^${trimmedEmail}$`, 'i') } });
    } catch (findError) {
      logger.error('User find error:', {
        message: findError.message,
        stack: findError.stack,
        name: findError.name,
        email: trimmedEmail
      });
      return res.status(500).json({ 
        message: 'Server error during user lookup',
        error: process.env.NODE_ENV === 'development' ? findError.message : undefined
      });
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if user has a password (should always be true, but safety check)
    if (!user.password) {
      logger.error('Login error: User found but password is missing', { userId: user._id, email });
      return res.status(500).json({ 
        message: 'Server error: User account configuration issue',
        error: 'Password missing'
      });
    }

    // Verify password
    let passwordMatch = false;
    try {
      passwordMatch = await user.matchPassword(password);
    } catch (matchError) {
      logger.error('Password match error:', {
        message: matchError.message,
        stack: matchError.stack,
        name: matchError.name,
        email: email
      });
      return res.status(500).json({ 
        message: 'Server error during password verification',
        error: process.env.NODE_ENV === 'development' ? matchError.message : undefined
      });
    }

    if (passwordMatch) {
      // Reset failed login attempts
      user.failedLoginAttempts = 0;
      user.lockedUntil = undefined;
      user.lastLoginAt = new Date();
      user.lastLoginIp = req.ip || req.connection.remoteAddress;
      
      // Generate tokens
      let accessToken, refreshToken;
      try {
        const role = normalizeRole(user.role);
        accessToken = generateAccessToken(user._id, role);
        refreshToken = generateRefreshToken(user._id, role);
        
        // Store refresh token in user document
        const refreshTokenExpiry = new Date();
        refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7); // 7 days
        
        // Clean old refresh tokens (keep only last 5)
        if (user.refreshTokens.length >= 5) {
          user.refreshTokens = user.refreshTokens
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 4);
        }
        
        user.refreshTokens.push({
          token: refreshToken,
          expiresAt: refreshTokenExpiry,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
        });
        
        await user.save();
        setAuthCookies(res, accessToken, refreshToken);
      } catch (tokenError) {
        logger.error('Token generation error:', {
          message: tokenError.message,
          stack: tokenError.stack,
          name: tokenError.name,
          email: email
        });
        return res.status(500).json({ 
          message: 'Server error during token generation',
          error: process.env.NODE_ENV === 'development' ? tokenError.message : undefined
        });
      }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: normalizeRole(user.role),
        token: accessToken,
        refreshToken: refreshToken,
      });
    } else {
      // Increment failed login attempts
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      
      // Lock account after 5 failed attempts for 30 minutes
      if (user.failedLoginAttempts >= 5) {
        const lockUntil = new Date();
        lockUntil.setMinutes(lockUntil.getMinutes() + 30);
        user.lockedUntil = lockUntil;
        
        logger.security.accountLocked(
          email,
          req.ip || req.connection.remoteAddress,
          lockUntil
        );
      }
      
      await user.save();
      
      logger.security.failedLogin(
        email,
        req.ip || req.connection.remoteAddress,
        user.failedLoginAttempts
      );
      
      res.status(401).json({ 
        message: 'Invalid email or password',
        failedAttempts: user.failedLoginAttempts,
        lockedUntil: user.lockedUntil || null
      });
    }
  } catch (error) {
    // Ensure CORS headers are set even on error
    setCORSHeaders(req, res);
    
    // Log full error details for debugging
    logger.error('Login error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      email: req.body?.email || 'N/A',
      readyState: mongoose.connection?.readyState
    });
    
    // Return appropriate error message
    if (error.message && error.message.includes('JWT_SECRET')) {
      return res.status(500).json({ 
        message: 'Server configuration error. Please contact support.',
        error: 'JWT_SECRET missing'
      });
    } else if (error.name === 'MongoError' || error.name === 'MongooseError' || error.name === 'MongoServerError') {
      return res.status(500).json({ 
        message: 'Database connection error. Please try again later.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    } else {
      return res.status(500).json({ 
        message: 'Server error during login',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  // Always set CORS headers first
  setCORSHeaders(req, res);
  
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: normalizeRole(user.role),
      isApproved: user.isApproved,
      approvedAt: user.approvedAt,
      phone: user.phone,
      bio: user.bio,
      location: user.location,
      dateOfBirth: user.dateOfBirth,
      website: user.website,
      socialLinks: user.socialLinks,
      createdAt: user.createdAt,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  // Always set CORS headers first
  setCORSHeaders(req, res);
  
  try {
    const { name, email, phone, bio, location, dateOfBirth, website, socialLinks } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      user.email = email;
    }

    // Update fields (sanitize UGC)
    if (name !== undefined) user.name = sanitizeName(name);
    if (phone !== undefined) user.phone = phone;
    if (bio !== undefined) user.bio = sanitizeText(bio || '');
    if (location !== undefined) user.location = sanitizeText(location || '');
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;
    if (website !== undefined) user.website = website;
    if (socialLinks !== undefined) {
      user.socialLinks = {
        ...user.socialLinks,
        ...socialLinks,
      };
    }

    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: normalizeRole(user.role),
      phone: user.phone,
      bio: user.bio,
      location: user.location,
      dateOfBirth: user.dateOfBirth,
      website: user.website,
      socialLinks: user.socialLinks,
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
const refreshTokenHandler = async (req, res) => {
  setCORSHeaders(req, res);
  
  try {
    logger.info('🔄 Refresh token handler called');
    
    const { refreshToken: token } = req.body;
    const cookies = parseCookies(req);
    const refreshTokenFromCookie = cookies.refreshToken;
    const effectiveToken = token || refreshTokenFromCookie;
    
    logger.info('📋 Refresh token input:', {
      hasBodyToken: !!token,
      hasCookieToken: !!refreshTokenFromCookie,
      tokenLength: effectiveToken ? effectiveToken.length : 0,
    });
    
    if (!effectiveToken) {
      logger.info('❌ No refresh token provided');
      return res.status(400).json({ message: 'Refresh token is required' });
    }
    
    if (!process.env.JWT_SECRET) {
      logger.error('❌ JWT_SECRET not configured');
      return res.status(500).json({ message: 'Server configuration error' });
    }
    
    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(effectiveToken, process.env.JWT_SECRET);
      logger.info('✅ Token verified, decoded:', { id: decoded.id, type: decoded.type, role: decoded.role });
    } catch (error) {
      logger.info('❌ Token verification failed:', error.message);
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }
    
    // Check token type
    if (decoded.type !== 'refresh') {
      logger.info('❌ Invalid token type:', decoded.type);
      return res.status(401).json({ message: 'Invalid token type' });
    }
    
    // Ensure database connection
    try {
      if (mongoose.connection.readyState !== 1) {
        logger.info('⚠️ Database not connected, attempting reconnect...');
        await connectDB();
        logger.info('✅ Database reconnected');
      }
    } catch (dbError) {
      logger.error('❌ Database connection error:', dbError.message);
      return res.status(500).json({ message: 'Database connection error' });
    }
    
    // Find user and verify refresh token exists
    let user;
    try {
      user = await User.findById(decoded.id);
      logger.info('👤 User lookup:', { found: !!user, userId: decoded.id });
    } catch (findError) {
      logger.error('❌ User find error:', findError.message);
      return res.status(500).json({ message: 'Database error during user lookup' });
    }
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Check if refresh token exists in user's refresh tokens
    logger.info('🔍 Checking stored tokens, count:', user.refreshTokens?.length || 0);
    
    if (!user.refreshTokens || !Array.isArray(user.refreshTokens)) {
      logger.info('❌ User has no refreshTokens array');
      return res.status(401).json({ message: 'No refresh tokens found for user' });
    }
    
    const storedToken = user.refreshTokens.find(
      rt => rt.token === effectiveToken && rt.expiresAt > new Date()
    );
    
    logger.info('🔑 Stored token check:', { found: !!storedToken });
    
    if (!storedToken) {
      // Check if token exists but is expired
      const expiredToken = user.refreshTokens.find(rt => rt.token === effectiveToken);
      logger.info('❌ Token not valid, expired:', !!expiredToken);
      return res.status(401).json({ message: 'Refresh token not found or expired' });
    }
    
    // Generate new access token
    let accessToken;
    try {
      const normalizedRole = normalizeRole(user.role);
      logger.info('🔧 Generating access token:', { userId: user._id, role: normalizedRole });
      accessToken = generateAccessToken(user._id, normalizedRole);
      logger.info('✅ Access token generated, length:', accessToken?.length);
    } catch (tokenError) {
      logger.error('❌ Token generation error:', tokenError.message);
      return res.status(500).json({ message: 'Failed to generate access token' });
    }
    
    try {
      logger.security.tokenRefresh(user._id.toString(), true);
    } catch (logError) {
      logger.error('⚠️ Logger error (non-critical):', logError.message);
    }
    
    res.cookie('accessToken', accessToken, getCookieOptions(false));
    
    logger.info('✅ Refresh token success');
    res.json({
      token: accessToken,
    });
  } catch (error) {
    logger.error('❌ Refresh token unhandled error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    res.status(500).json({ message: 'Server error during token refresh', detail: error.message });
  }
};

// @desc    Logout (revoke refresh token)
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  setCORSHeaders(req, res);
  
  try {
    const { refreshToken: token } = req.body;
    const cookies = parseCookies(req);
    const refreshTokenFromCookie = cookies.refreshToken;
    const effectiveToken = token || refreshTokenFromCookie;
    
    if (effectiveToken) {
      const user = await User.findById(req.user._id);
      if (user) {
        // Remove refresh token
        user.refreshTokens = user.refreshTokens.filter(rt => rt.token !== effectiveToken);
        await user.save();
      }
    }

    clearAuthCookies(res);
    
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ message: 'Server error during logout' });
  }
};

export { registerUser, loginUser, getMe, updateProfile, refreshTokenHandler, logout, partnerSignup, upgradeToOperator };
