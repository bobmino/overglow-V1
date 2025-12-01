import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import { notFound, errorHandler } from './backend/middleware/errorMiddleware.js';

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
import favoriteRoutes from './backend/routes/favoriteRoutes.js';
import recommendationRoutes from './backend/routes/recommendationRoutes.js';
import loyaltyRoutes from './backend/routes/loyaltyRoutes.js';
import badgeRoutes from './backend/routes/badgeRoutes.js';
import viewHistoryRoutes from './backend/routes/viewHistoryRoutes.js';

// Connect to database (non-blocking for Vercel)
// This is async and won't block serverless function startup
connectDB().catch(err => {
  console.error('Database connection initialization error:', err.message);
  // Never exit on Vercel - allow function to start and retry on first request
});

const app = express();

// CORS configuration - CRITICAL: Must be FIRST middleware
// This handles CORS for Vercel serverless functions
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Log for debugging (only in production to see what's happening)
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    console.log(`[CORS] ${req.method} ${req.path} from origin: ${origin || 'none'}`);
  }
  
  // Allow all Vercel domains and localhost - be permissive for now
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range, X-Content-Range');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // CRITICAL: Handle OPTIONS preflight requests immediately
  if (req.method === 'OPTIONS') {
    if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
      console.log(`[CORS] Handling OPTIONS preflight for ${req.path}`);
    }
    return res.status(200).json({ message: 'OK' });
  }
  
  next();
});

// Use cors package as additional layer
app.use(cors({
  origin: true, // Allow all origins
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

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
app.use('/api/favorites', favoriteRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/view-history', viewHistoryRoutes);

// Serve static files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

app.use(notFound);
app.use(errorHandler);

// Export handler for Vercel serverless functions
// For Vercel, we need to export the app directly
// The CORS middleware is already set up above
export default app;

// Only start server if not in Vercel environment (local development)
if (process.env.VERCEL !== '1' && !process.env.VERCEL_ENV) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
}
