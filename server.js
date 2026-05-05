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
import { initSentry, captureException } from './backend/utils/sentry.js';
import { logger } from './backend/utils/logger.js';

// Initialize Sentry BEFORE everything else
initSentry();

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', {
    reason: reason?.message || String(reason),
    stack: reason?.stack,
  });
  captureException(reason instanceof Error ? reason : new Error(String(reason)));
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', {
    message: error?.message,
    stack: error?.stack,
  });
  captureException(error);
});

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
import blogRoutes from './backend/routes/blogRoutes.js';

const app = express();

const corsOptions = {
  origin: true, // Autorise dynamiquement l'origine de la requête
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
};

// Connect to database (non-blocking for Vercel)
// This is async and won't block serverless function startup
connectDB().then(async () => {
  try {
    const { default: Product } = await import('./backend/models/productModel.js');
    await Product.updateMany({}, { $set: { status: 'Published' } });
    console.log('Force-updated all products to Published status at startup.');
  } catch (err) {
    console.error('Failed to force products to Published:', err);
  }
}).catch(err => {
  console.error('Database connection initialization error:', err.message);
  // Never exit on Vercel - allow function to start and retry on first request
  // Don't throw - let the function start even if DB connection fails
});

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

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

app.use(express.json());

// Serve static files from frontend/dist (for Vercel deployment)
// This ensures that JavaScript, CSS, and other assets are served correctly
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.join(__dirname, 'frontend', 'dist');

// Only serve static files if the directory exists (production)
if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
  // Serve static assets (JS, CSS, images, etc.)
  app.use('/assets', express.static(path.join(frontendDistPath, 'assets'), {
    maxAge: '1y',
    immutable: true,
    setHeaders: (res, filePath) => {
      // Set correct MIME types
      if (filePath.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      } else if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      }
    }
  }));
  
  // Serve other static files (favicon, manifest, etc.)
  app.use(express.static(frontendDistPath, {
    maxAge: '1y',
    immutable: true
  }));
  
  // Serve index.html for all non-API routes (SPA fallback)
  app.get('*', (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api')) {
      return next();
    }
    // Skip if it's a file request (has extension)
    if (req.path.match(/\.[a-zA-Z0-9]+$/)) {
      return next();
    }
    // Serve index.html for SPA routes
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

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
app.use('/api/blog', blogRoutes);
app.use('/api', sitemapRoutes);

// Serve static files (reuse __dirname from above)
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
