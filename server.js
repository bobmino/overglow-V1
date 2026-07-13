// server.js — Point d'entrée Express (local + Vercel serverless via api/index.js)
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import { corsOptions } from './backend/config/cors.js';
import { validatePaymentEnvAtStartup } from './backend/config/paymentEnv.js';
import { initSentry } from './backend/utils/sentry.js';
import { apiLimiter } from './backend/middleware/rateLimiter.js';
import { notFound, errorHandler } from './backend/middleware/errorMiddleware.js';

// Routes API
import authRoutes from './backend/routes/authRoutes.js';
import productRoutes from './backend/routes/productRoutes.js';
import scheduleRoutes from './backend/routes/scheduleRoutes.js';
import bookingRoutes from './backend/routes/bookingRoutes.js';
import adminRoutes from './backend/routes/adminRoutes.js';
import operatorRoutes from './backend/routes/operatorRoutes.js';
import onboardingRoutes from './backend/routes/onboardingRoutes.js';
import operatorWizardRoutes from './backend/routes/operatorWizardRoutes.js';
import paymentRoutes from './backend/routes/paymentRoutes.js';
import uploadRoutes from './backend/routes/uploadRoutes.js';
import searchRoutes from './backend/routes/searchRoutes.js';
import inquiryRoutes from './backend/routes/inquiryRoutes.js';
import settingsRoutes from './backend/routes/settingsRoutes.js';
import reviewRoutes from './backend/routes/reviewRoutes.js';
import notificationRoutes from './backend/routes/notificationRoutes.js';
import withdrawalRoutes from './backend/routes/withdrawalRoutes.js';
import approvalRequestRoutes from './backend/routes/approvalRequestRoutes.js';
import badgeRoutes from './backend/routes/badgeRoutes.js';
import badgeRequestRoutes from './backend/routes/badgeRequestRoutes.js';
import favoriteRoutes from './backend/routes/favoriteRoutes.js';
import recommendationRoutes from './backend/routes/recommendationRoutes.js';
import loyaltyRoutes from './backend/routes/loyaltyRoutes.js';
import viewHistoryRoutes from './backend/routes/viewHistoryRoutes.js';
import faqRoutes from './backend/routes/faqRoutes.js';
import chatRoutes from './backend/routes/chatRoutes.js';
import blogRoutes from './backend/routes/blogRoutes.js';
import healthRoutes from './backend/routes/healthRoutes.js';
import sitemapRoutes from './backend/routes/sitemapRoutes.js';
import orderRoutes from './backend/routes/orderRoutes.js';
import homepageRoutes from './backend/routes/homepageRoutes.js';
import contentRoutes from './backend/routes/contentRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5001;
const isVercel = process.env.VERCEL === '1' || Boolean(process.env.VERCEL_ENV);

// Initialisation Sentry (non bloquante si DSN absent)
initSentry();

// [TASK-3] Valide CMI_STORE_KEY + BANK_IBAN/BANK_SWIFT au démarrage (fail en prod)
validatePaymentEnvAtStartup();

const app = express();

// Requis pour express-rate-limit derrière le proxy Vercel
app.set('trust proxy', 1);

// ─── CORS (allowlist centralisée — backend/config/cors.js) ───────────────────
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ─── Sécurité & parsing ─────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'https://js.stripe.com', 'https://m.stripe.network'],
        frameSrc: ["'self'", 'https://js.stripe.com', 'https://hooks.stripe.com'],
        connectSrc: ["'self'", 'https://api.stripe.com'],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
  })
);

// Preserve raw body for Stripe webhook signature verification
app.use(
  express.json({
    limit: '10mb',
    verify: (req, res, buf) => {
      if (req.originalUrl && req.originalUrl.includes('/api/payments/webhook/stripe')) {
        req.rawBody = buf;
      }
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Fichiers statiques (images uploadées localement) ───────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Connexion MongoDB ──────────────────────────────────────────────────────
connectDB().catch((err) => {
  console.error('MongoDB connection failed at startup:', err.message);
});

// ─── Rate limiting global API ─────────────────────────────────────────────────
app.use('/api', apiLimiter);

// ─── Routes racine ────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Overglow API running',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

// ─── Montage des routes API ───────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/operator', operatorRoutes);
app.use('/api/operator/onboarding', onboardingRoutes);
app.use('/api/operator/wizard', operatorWizardRoutes);
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
app.use('/api/health', healthRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/homepage', homepageRoutes);
app.use('/api/content', contentRoutes);
app.use('/api', sitemapRoutes);

// ─── SPA fallback (production locale uniquement, hors Vercel serverless) ─────
if (!isVercel) {
  const frontendDist = path.join(__dirname, 'frontend', 'dist');
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'), (err) => {
      if (err) next();
    });
  });
}

// ─── Gestion des erreurs ──────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Démarrage serveur local (pas sur Vercel serverless) ─────────────────────
if (!isVercel) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
