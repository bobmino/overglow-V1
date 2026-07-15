/**
 * [PROMPT-18] Handlebars email template renderer (FR/EN).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Handlebars from 'handlebars';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATES_DIR = path.join(__dirname, '..', 'templates', 'emails');

const FRONTEND_URL = (process.env.FRONTEND_URL || 'https://www.overglowtrip.com').replace(/\/$/, '');

export const EMAIL_TEMPLATE_META = [
  { id: 'confirmation', name: 'Confirmation de réservation', description: 'Envoyé au voyageur après paiement' },
  { id: 'operator-booking', name: 'Nouvelle réservation (opérateur)', description: 'Notification opérateur' },
  { id: 'welcome', name: 'Bienvenue', description: 'Nouvel utilisateur' },
  { id: 'operator-approved', name: 'Opérateur approuvé', description: 'Compte partenaire validé' },
  { id: 'operator-rejected', name: 'Opérateur refusé', description: 'Compte partenaire refusé + motif' },
  { id: 'review-notification', name: 'Nouvel avis', description: 'Avis sur un produit opérateur' },
  { id: 'withdrawal-processed', name: 'Retrait traité', description: 'Retrait approuvé / payé' },
  { id: 'password-reset', name: 'Réinitialisation mot de passe', description: 'Lien de reset' },
];

const COPY = {
  fr: {
    footerVisit: 'Visiter le site',
    footerHelp: 'Aide',
    footerUnsubscribe: 'Se désabonner',
    companyAddress: 'Overglow Trip — Marketplace tourisme Maroc',
    confirmation: {
      pageTitle: 'Confirmation de réservation',
      headerSubtitle: 'Votre aventure commence',
      greeting: 'Bonjour {{userName}},',
      intro: 'Votre réservation est confirmée. Voici le récapitulatif :',
      detailsTitle: 'Détails de la réservation',
      labelProduct: 'Expérience',
      labelDate: 'Date',
      labelTime: 'Horaire',
      labelTickets: 'Billets',
      labelRef: 'Référence',
      labelTotal: 'Total payé',
      ctaLabel: 'Voir mes réservations',
      outro: 'Une question ? Répondez à cet email ou contactez le support.',
      subject: '✅ Réservation confirmée — Overglow Trip',
    },
    'operator-booking': {
      pageTitle: 'Nouvelle réservation',
      headerSubtitle: 'Notification opérateur',
      greeting: 'Bonjour {{operatorName}},',
      intro: 'Vous avez reçu une nouvelle réservation.',
      detailsTitle: 'Réservation',
      labelClient: 'Client',
      labelProduct: 'Produit',
      labelDate: 'Date',
      labelTickets: 'Billets',
      labelTotal: 'Montant',
      labelRef: 'Référence',
      ctaLabel: 'Ouvrir mon espace',
      subject: '🔔 Nouvelle réservation — Overglow Trip',
    },
    welcome: {
      pageTitle: 'Bienvenue',
      headerSubtitle: 'Bienvenue sur Overglow Trip',
      greeting: 'Bonjour {{userName}},',
      intro: 'Nous sommes ravis de vous accueillir.',
      body: 'Explorez des expériences authentiques et des séjours d’exception au Maroc.',
      ctaLabel: 'Explorer les expériences',
      outro: 'À très bientôt sur Overglow Trip.',
      subject: '👋 Bienvenue sur Overglow Trip !',
    },
    'operator-approved': {
      pageTitle: 'Compte approuvé',
      headerSubtitle: 'Partenaire Overglow',
      greeting: 'Félicitations {{userName}},',
      intro: 'Votre compte opérateur a été approuvé.',
      body: 'Vous pouvez dès maintenant publier vos expériences et gérer vos réservations.',
      ctaLabel: 'Accéder au tableau de bord',
      outro: 'Bienvenue dans la communauté Overglow.',
      subject: '🎉 Votre compte opérateur est approuvé',
    },
    'operator-rejected': {
      pageTitle: 'Demande refusée',
      headerSubtitle: 'Inscription opérateur',
      greeting: 'Bonjour {{userName}},',
      intro: 'Votre demande d’inscription opérateur n’a pas pu être approuvée pour le moment.',
      reasonLabel: 'Motif',
      body: 'Vous pouvez mettre à jour votre dossier et soumettre une nouvelle demande.',
      ctaLabel: 'Revoir mon onboarding',
      subject: 'Mise à jour de votre demande opérateur',
    },
    'review-notification': {
      pageTitle: 'Nouvel avis',
      headerSubtitle: 'Avis client',
      greeting: 'Bonjour {{operatorName}},',
      intro: 'Un voyageur a laissé un avis sur votre produit.',
      labelProduct: 'Produit',
      labelRating: 'Note',
      labelAuthor: 'Auteur',
      ctaLabel: 'Voir les avis',
      subject: '⭐ Nouvel avis sur votre produit',
    },
    'withdrawal-processed': {
      pageTitle: 'Retrait traité',
      headerSubtitle: 'Paiement',
      greeting: 'Bonjour {{userName}},',
      intro: 'Votre demande de retrait a été traitée.',
      labelAmount: 'Montant',
      labelStatus: 'Statut',
      labelRef: 'Référence',
      body: 'Le virement peut prendre 3 à 5 jours ouvrés selon votre banque.',
      ctaLabel: 'Voir mes retraits',
      subject: '💰 Retrait traité — Overglow Trip',
    },
    'password-reset': {
      pageTitle: 'Réinitialisation',
      headerSubtitle: 'Sécurité du compte',
      greeting: 'Bonjour {{userName}},',
      intro: 'Vous avez demandé la réinitialisation de votre mot de passe.',
      body: 'Ce lien expire dans 1 heure. Si vous n’êtes pas à l’origine de cette demande, ignorez cet email.',
      ctaLabel: 'Réinitialiser mon mot de passe',
      outro: 'Votre mot de passe actuel reste inchangé tant que vous n’en créez pas un nouveau.',
      linkFallback: 'Lien alternatif',
      subject: '🔐 Réinitialisation de votre mot de passe',
    },
  },
  en: {
    footerVisit: 'Visit website',
    footerHelp: 'Help',
    footerUnsubscribe: 'Unsubscribe',
    companyAddress: 'Overglow Trip — Morocco tourism marketplace',
    confirmation: {
      pageTitle: 'Booking confirmation',
      headerSubtitle: 'Your adventure starts',
      greeting: 'Hello {{userName}},',
      intro: 'Your booking is confirmed. Here is the summary:',
      detailsTitle: 'Booking details',
      labelProduct: 'Experience',
      labelDate: 'Date',
      labelTime: 'Time',
      labelTickets: 'Tickets',
      labelRef: 'Reference',
      labelTotal: 'Total paid',
      ctaLabel: 'View my bookings',
      outro: 'Questions? Reply to this email or contact support.',
      subject: '✅ Booking confirmed — Overglow Trip',
    },
    'operator-booking': {
      pageTitle: 'New booking',
      headerSubtitle: 'Operator notification',
      greeting: 'Hello {{operatorName}},',
      intro: 'You received a new booking.',
      detailsTitle: 'Booking',
      labelClient: 'Guest',
      labelProduct: 'Product',
      labelDate: 'Date',
      labelTickets: 'Tickets',
      labelTotal: 'Amount',
      labelRef: 'Reference',
      ctaLabel: 'Open dashboard',
      subject: '🔔 New booking — Overglow Trip',
    },
    welcome: {
      pageTitle: 'Welcome',
      headerSubtitle: 'Welcome to Overglow Trip',
      greeting: 'Hello {{userName}},',
      intro: 'We are thrilled to have you.',
      body: 'Explore authentic experiences and luxury stays across Morocco.',
      ctaLabel: 'Explore experiences',
      outro: 'See you soon on Overglow Trip.',
      subject: '👋 Welcome to Overglow Trip!',
    },
    'operator-approved': {
      pageTitle: 'Account approved',
      headerSubtitle: 'Overglow partner',
      greeting: 'Congratulations {{userName}},',
      intro: 'Your operator account has been approved.',
      body: 'You can now publish experiences and manage bookings.',
      ctaLabel: 'Go to dashboard',
      outro: 'Welcome to the Overglow community.',
      subject: '🎉 Your operator account is approved',
    },
    'operator-rejected': {
      pageTitle: 'Application declined',
      headerSubtitle: 'Operator signup',
      greeting: 'Hello {{userName}},',
      intro: 'Your operator application could not be approved at this time.',
      reasonLabel: 'Reason',
      body: 'You can update your profile and submit a new application.',
      ctaLabel: 'Review onboarding',
      subject: 'Update on your operator application',
    },
    'review-notification': {
      pageTitle: 'New review',
      headerSubtitle: 'Guest review',
      greeting: 'Hello {{operatorName}},',
      intro: 'A traveler left a review on your product.',
      labelProduct: 'Product',
      labelRating: 'Rating',
      labelAuthor: 'Author',
      ctaLabel: 'View reviews',
      subject: '⭐ New review on your product',
    },
    'withdrawal-processed': {
      pageTitle: 'Withdrawal processed',
      headerSubtitle: 'Payout',
      greeting: 'Hello {{userName}},',
      intro: 'Your withdrawal request has been processed.',
      labelAmount: 'Amount',
      labelStatus: 'Status',
      labelRef: 'Reference',
      body: 'The transfer may take 3–5 business days depending on your bank.',
      ctaLabel: 'View withdrawals',
      subject: '💰 Withdrawal processed — Overglow Trip',
    },
    'password-reset': {
      pageTitle: 'Password reset',
      headerSubtitle: 'Account security',
      greeting: 'Hello {{userName}},',
      intro: 'You requested a password reset.',
      body: 'This link expires in 1 hour. If you did not request this, ignore this email.',
      ctaLabel: 'Reset my password',
      outro: 'Your current password stays unchanged until you set a new one.',
      linkFallback: 'Alternate link',
      subject: '🔐 Reset your password',
    },
  },
};

let partialsRegistered = false;

const registerPartials = () => {
  if (partialsRegistered) return;
  const chrome = fs.readFileSync(path.join(TEMPLATES_DIR, 'partials', 'chrome.hbs'), 'utf8');
  Handlebars.registerPartial('chrome', chrome);
  partialsRegistered = true;
};

const interpolate = (templateStr, vars) =>
  String(templateStr || '').replace(/\{\{(\w+)\}\}/g, (_, key) =>
    vars[key] != null ? String(vars[key]) : ''
  );

export const getSampleData = (templateId) => {
  const base = {
    userName: 'Amine',
    operatorName: 'Atlas Experiences',
    clientName: 'Sarah Dupont',
    clientEmail: 'sarah@example.com',
    productTitle: 'Visite guidée médina de Marrakech',
    bookingDate: '15 juillet 2026',
    bookingTime: '10:00',
    tickets: '2',
    bookingRef: 'A1B2C3D4',
    totalPrice: '560 MAD',
    reason: 'Documents d’immatriculation incomplets',
    rating: '5',
    authorName: 'Jean M.',
    comment: 'Expérience authentique, guide excellent !',
    amount: '2 500 MAD',
    statusLabel: 'Payé',
    withdrawalRef: 'WD9988',
    resetUrl: `${FRONTEND_URL}/reset-password/sample-token`,
  };

  const ctaById = {
    confirmation: `${FRONTEND_URL}/dashboard`,
    'operator-booking': `${FRONTEND_URL}/operator/bookings`,
    welcome: `${FRONTEND_URL}/explore`,
    'operator-approved': `${FRONTEND_URL}/operator/dashboard`,
    'operator-rejected': `${FRONTEND_URL}/operator/onboarding`,
    'review-notification': `${FRONTEND_URL}/operator/dashboard`,
    'withdrawal-processed': `${FRONTEND_URL}/operator/withdrawals`,
    'password-reset': base.resetUrl,
  };

  return { ...base, ctaUrl: ctaById[templateId] || FRONTEND_URL };
};

/**
 * Render a transactional email template.
 * @returns {{ html: string, subject: string, locale: string }}
 */
export const renderEmailTemplate = (templateId, data = {}, locale = 'fr') => {
  const lang = locale === 'en' ? 'en' : 'fr';
  const meta = EMAIL_TEMPLATE_META.find((t) => t.id === templateId);
  if (!meta) {
    throw new Error(`Unknown email template: ${templateId}`);
  }

  registerPartials();

  const copyRoot = COPY[lang];
  const strings = copyRoot[templateId];
  if (!strings) throw new Error(`Missing copy for ${templateId}/${lang}`);

  const merged = { ...getSampleData(templateId), ...data };
  const bodySource = fs.readFileSync(path.join(TEMPLATES_DIR, `${templateId}.hbs`), 'utf8');
  const bodyHtml = Handlebars.compile(bodySource)({
    ...merged,
    ...Object.fromEntries(
      Object.entries(strings).map(([k, v]) => [k, interpolate(v, merged)])
    ),
  });

  const layoutSource = fs.readFileSync(path.join(TEMPLATES_DIR, 'partials', 'layout.hbs'), 'utf8');
  const html = Handlebars.compile(layoutSource)({
    locale: lang,
    pageTitle: interpolate(strings.pageTitle, merged),
    body: bodyHtml,
    headerSubtitle: interpolate(strings.headerSubtitle, merged),
    frontendUrl: FRONTEND_URL,
    unsubscribeUrl: `${FRONTEND_URL}/profile`,
    year: new Date().getFullYear(),
    footerVisit: copyRoot.footerVisit,
    footerHelp: copyRoot.footerHelp,
    footerUnsubscribe: copyRoot.footerUnsubscribe,
    companyAddress: copyRoot.companyAddress,
  });

  return {
    html,
    subject: interpolate(strings.subject, merged),
    locale: lang,
  };
};

export default renderEmailTemplate;
