import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import { notFound, errorHandler } from './backend/middleware/errorMiddleware.js';
import { apiLimiter, strictLimiter } from './backend/middleware/rateLimiter.js';

import authRoutes from './backend/routes/authRoutes.js';
import productRoutes from './backend/routes/productRoutes.js';
import scheduleRoutes from './backend/routes/scheduleRoutes.js';
import bookingRoutes from './backend/routes/bookingRoutes.js';
import operatorRoutes from './backend/routes/operatorRoutes.js';
import operatorWizardRoutes from './backend/routes/operatorWizardRoutes.js';
import adminRoutes from './backend/routes/adminRoutes.js';
import paymentRoutes from './backend/routes/paymentRoutes.js';
import uploadRoutes from './backend/routes/uploadRoutes.js';
import searchRoutes from './backend/routes/searchRoutes.js';
import inquiryRoutes from './backend/routes/inquiryRoutes.js';
import settingsRoutes from './backend/routes/settingsRoutes.js';
import reviewRoutes from './backend/routes/reviewRoutes.js';
import notificationRoutes from './backend/routes/notificationRoutes.js';
import withdrawalRoutes from './backend/routes/withdrawalRoutes.js';
import approvalRequestRoutes from './backend/routes/approvalRequestRoutes.js';
import onboardingRoutes from './backend/routes/onboardingRoutes.js';
import badgeRoutes from './backend/routes/badgeRoutes.js';
import badgeRequestRoutes from './backend/routes/badgeRequestRoutes.js';
import favoriteRoutes from './backend/routes/favoriteRoutes.js';
import recommendationRoutes from './backend/routes/recommendationRoutes.js';
import loyaltyRoutes from './backend/routes/loyaltyRoutes.js';
import viewHistoryRoutes from './backend/routes/viewHistoryRoutes.js';
import faqRoutes from './backend/routes/faqRoutes.js';
import chatRoutes from './backend/routes/chatRoutes.js';
import healthRoutes from './backend/routes/healthRoutes.js';
import sitemapRoutes from './backend/routes/sitemapRoutes.js';

const app = express();

// CRITICAL: Handle OPTIONS IMMEDIATELY - before ANY other code execution
// This must be the absolute first thing after creating the app
app.options('*', (req, res) => {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
  return res.status(200).end();
});

// Connect to database (non-blocking for Vercel)
// This is async and won't block serverless function startup
connectDB().catch(err => {
  console.error('Database connection initialization error:', err.message);
  // Never exit on Vercel - allow function to start and retry on first request
  // Don't throw - let the function start even if DB connection fails
});

// CRITICAL: Handle OPTIONS preflight requests FIRST, before ANY other middleware
// This MUST be the absolute first middleware - even before express.json() or anything else
// Use a try-catch to ensure it never fails
app.use((req, res, next) => {
  try {
    if (req.method === 'OPTIONS') {
      const origin = req.headers.origin || '*';
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Max-Age', '86400');
      return res.status(200).end();
    }
    next();
  } catch (err) {
    // If anything fails, still try to send OPTIONS response
    console.error('OPTIONS handler error:', err);
    try {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
      if (req.method === 'OPTIONS') {
        return res.status(200).end();
      }
    } catch (e) {
      // Last resort - just send 200
      if (req.method === 'OPTIONS') {
        return res.status(200).end();
      }
    }
    next();
  }
});

// CORS configuration - Must be after OPTIONS handler
// This handles CORS for Vercel serverless functions
const allowedOrigins = [
  'https://overglow-v1-3jqp.vercel.app',
  'https://overglow-v1.vercel.app',
  'https://overglow-frontend.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5174',
];

// Custom CORS middleware for all requests (non-OPTIONS)
app.use((req, res, next) => {
  // Skip if already handled OPTIONS above
  if (req.method === 'OPTIONS') {
    return next();
  }
  
  const origin = req.headers.origin;
  
  // Check if origin is allowed
  if (origin && (allowedOrigins.includes(origin) || origin.includes('vercel.app') || origin.includes('localhost'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    // Allow requests without origin (like Postman, curl)
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else {
    // For other origins, still allow
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range, X-Content-Range');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  next();
});

// Security headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:", "http:"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        connectSrc: ["'self'", "https://api.stripe.com", "https://api.paypal.com"],
      },
    },
    crossOriginEmbedderPolicy: false, // Désactivé pour compatibilité CORS
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Additional security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

// Apply rate limiting globally (after helmet, before CORS)
app.use('/api/', apiLimiter);

// Use cors package as additional layer with explicit configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list or is a Vercel domain
    if (allowedOrigins.includes(origin) || 
        origin.includes('vercel.app') || 
        origin.includes('localhost')) {
      callback(null, true);
    } else {
      // Still allow but log
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ 
    message: 'API is running...',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Health check endpoint (using dedicated route)
app.use('/api/health', healthRoutes);

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/operator/onboarding', onboardingRoutes);
app.use('/api/operator', operatorRoutes);
app.use('/api/operator/wizard', operatorWizardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/approval-requests', approvalRequestRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/badge-requests', badgeRequestRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/view-history', viewHistoryRoutes);
app.use('/api/faq', faqRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api', sitemapRoutes);

// Serve static files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

app.use(notFound);
app.use(errorHandler);

// Export handler for Vercel serverless functions
// For Vercel, we export the app directly - it handles requests automatically
// The CORS middleware is already set up above to handle OPTIONS first
export default app;

// Only start server if not in Vercel environment (local development)
if (process.env.VERCEL !== '1' && !process.env.VERCEL_ENV) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
}
