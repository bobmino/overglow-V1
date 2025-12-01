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

// Connect to database (non-blocking for Vercel)
connectDB().catch(err => {
  console.error('Database connection error:', err);
  // Don't exit on Vercel, let it retry
  if (process.env.VERCEL !== '1') {
    process.exit(1);
  }
});

const app = express();

// CORS configuration - Allow Vercel frontend and local development
const allowedOrigins = [
  'https://overglow-v1-3jqp.vercel.app',
  'https://overglow-v1.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000'
];

// CORS middleware with explicit configuration for Vercel
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Always set CORS headers - allow all Vercel domains and localhost
  if (!origin || allowedOrigins.includes(origin) || origin.includes('.vercel.app')) {
    // Set the exact origin for better security
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Range, X-Content-Range');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    
    // Handle preflight requests immediately
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
  } else {
    // Even for unknown origins, set basic CORS to avoid blocking
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
  }
  
  next();
});

// Fallback CORS using cors package for additional compatibility
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Allow all Vercel domains and localhost
    if (allowedOrigins.includes(origin) || origin.includes('.vercel.app') || origin.includes('localhost')) {
      callback(null, true);
    } else {
      // Allow all origins for development (can be restricted in production)
      callback(null, true);
    }
  },
  credentials: false, // Not needed with JWT
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(express.json());

app.get('/', (req, res) => {
  res.send('API is running...');
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

// Serve static files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

app.use(notFound);
app.use(errorHandler);

// Export handler for Vercel serverless functions
export default app;

// Only start server if not in Vercel environment (local development)
if (process.env.VERCEL !== '1' && !process.env.VERCEL_ENV) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
}
