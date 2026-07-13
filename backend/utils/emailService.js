import pkg from 'nodemailer';
const { createTransport } = pkg;
import { logger } from './logger.js';
import {
  getBookingConfirmationTemplate,
  getCancellationTemplate,
  getOperatorBookingNotificationTemplate,
  getRefundProcessedTemplate,
  getWelcomeEmailTemplate,
  getOperatorOnboardingPendingTemplate,
  getOperatorApprovedTemplate,
} from './emailTemplates.js';
import { getBookingConfirmationPremiumTemplate } from '../services/emailService.js';

/**
 * Single entry point for outbound email delivery (Sprint [8] consolidation).
 * Wraps transporter.sendMail with a lightweight retry + exponential backoff,
 * so every function below benefits without duplicating retry logic per call site.
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const sendMailWithRetry = async (mailOptions, { retries = 2, baseDelayMs = 500 } = {}) => {
  if (!transporter) {
    throw new Error('Email transporter is not configured');
  }

  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await transporter.sendMail(mailOptions);
    } catch (error) {
      lastError = error;
      const isLastAttempt = attempt === retries;
      logger.warn(`⚠️  Email send attempt ${attempt + 1}/${retries + 1} failed for ${mailOptions.to}: ${error.message}`);
      if (!isLastAttempt) {
        await sleep(baseDelayMs * 2 ** attempt); // 500ms, 1000ms, 2000ms...
      }
    }
  }
  throw lastError;
};

// Check if email is enabled
const isEmailEnabled = () => {
  return process.env.EMAIL_ENABLED !== 'false' && 
         process.env.EMAIL_USER && 
         process.env.EMAIL_PASS;
};

// Create transporter only if email is enabled
let transporter = null;

if (isEmailEnabled()) {
  try {
    transporter = createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: parseInt(process.env.EMAIL_PORT) === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      // Add connection timeout
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });

    // Verify connection
    transporter.verify((error, success) => {
      if (error) {
        logger.warn('⚠️  Email service not configured properly:', error.message);
        logger.warn('📧 To enable emails, configure EMAIL_USER and EMAIL_PASS in .env');
        logger.warn('📧 Or set EMAIL_ENABLED=false to disable email notifications');
        transporter = null;
      } else {
        logger.info('✅ Email service configured successfully');
      }
    });
  } catch (error) {
    logger.warn('⚠️  Failed to initialize email service:', error.message);
    transporter = null;
  }
} else {
  logger.info('📧 Email service disabled (set EMAIL_ENABLED=false or configure EMAIL_USER/EMAIL_PASS)');
}

// Send booking confirmation email
export const sendBookingConfirmation = async (booking, user, customHtml, whatsappLink) => {
  const premium = getBookingConfirmationPremiumTemplate({ booking, user, whatsappLink });
  const mailOptions = {
    from: `"Overglow Trip" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: premium.subject || '✅ Réservation confirmée - Overglow Trip',
    html: customHtml || premium.html || getBookingConfirmationTemplate(booking, user),
  };

  // Skip if email is disabled or transporter not available
  if (!transporter || !isEmailEnabled()) {
    if (process.env.NODE_ENV === 'development') {
      logger.info('📧 [DEV] Email would be sent to:', user.email);
      logger.info('📧 [DEV] Subject:', mailOptions.subject);
    }
    return;
  }

  try {
    await sendMailWithRetry(mailOptions);
    logger.info('✅ Booking confirmation email sent to:', user.email);
  } catch (error) {
    // Don't throw error, just log it - email failure shouldn't break the booking
    logger.error('❌ Error sending booking confirmation email:', error.message);
    if (error.code === 'EAUTH') {
      logger.error('💡 Tip: For Gmail, use an App Password instead of your regular password');
      logger.error('💡 See: https://support.google.com/accounts/answer/185833');
    }
  }
};

// Send cancellation email
export const sendCancellationEmail = async (booking, user, refundInfo = null) => {
  const mailOptions = {
    from: `"Overglow Trip" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: '❌ Réservation annulée - Overglow Trip',
    html: getCancellationTemplate(booking, user, refundInfo),
  };

  // Skip if email is disabled or transporter not available
  if (!transporter || !isEmailEnabled()) {
    if (process.env.NODE_ENV === 'development') {
      logger.info('📧 [DEV] Email would be sent to:', user.email);
      logger.info('📧 [DEV] Subject:', mailOptions.subject);
    }
    return;
  }

  try {
    await sendMailWithRetry(mailOptions);
    logger.info('✅ Cancellation email sent to:', user.email);
  } catch (error) {
    // Don't throw error, just log it - email failure shouldn't break the cancellation
    logger.error('❌ Error sending cancellation email:', error.message);
    if (error.code === 'EAUTH') {
      logger.error('💡 Tip: For Gmail, use an App Password instead of your regular password');
      logger.error('💡 See: https://support.google.com/accounts/answer/185833');
    }
  }
};

// Send operator booking notification email
export const sendOperatorBookingNotification = async (booking, operator, user) => {
  // Get operator user email
  const User = (await import('../models/userModel.js')).default;
  const operatorUser = await User.findById(operator.user || operator);
  
  if (!operatorUser || !operatorUser.email) {
    logger.warn('⚠️  Operator email not found, skipping email notification');
    return;
  }

  const mailOptions = {
    from: `"Overglow Trip" <${process.env.EMAIL_USER}>`,
    to: operatorUser.email,
    subject: '🎉 Nouvelle réservation reçue - Overglow Trip',
    html: getOperatorBookingNotificationTemplate(booking, operator, user),
  };

  // Skip if email is disabled or transporter not available
  if (!transporter || !isEmailEnabled()) {
    if (process.env.NODE_ENV === 'development') {
      logger.info('📧 [DEV] Email would be sent to operator:', operatorUser.email);
      logger.info('📧 [DEV] Subject:', mailOptions.subject);
    }
    return;
  }

  try {
    await sendMailWithRetry(mailOptions);
    logger.info('✅ Operator booking notification email sent to:', operatorUser.email);
  } catch (error) {
    // Don't throw error, just log it - email failure shouldn't break the booking
    logger.error('❌ Error sending operator booking notification email:', error.message);
  }
};

// Send refund processed email
export const sendRefundProcessedEmail = async (withdrawal, user) => {
  const mailOptions = {
    from: `"Overglow Trip" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: '✅ Remboursement effectué - Overglow Trip',
    html: getRefundProcessedTemplate(withdrawal, user),
  };

  // Skip if email is disabled or transporter not available
  if (!transporter || !isEmailEnabled()) {
    if (process.env.NODE_ENV === 'development') {
      logger.info('📧 [DEV] Email would be sent to:', user.email);
      logger.info('📧 [DEV] Subject:', mailOptions.subject);
    }
    return;
  }

  try {
    await sendMailWithRetry(mailOptions);
    logger.info('✅ Refund processed email sent to:', user.email);
  } catch (error) {
    logger.error('❌ Error sending refund processed email:', error.message);
  }
};

// Send welcome email
export const sendWelcomeEmail = async (user) => {
  const mailOptions = {
    from: `"Overglow Trip" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: '👋 Bienvenue sur Overglow Trip !',
    html: getWelcomeEmailTemplate(user),
  };

  if (!transporter || !isEmailEnabled()) return;

  try {
    await sendMailWithRetry(mailOptions);
  } catch (error) {
    logger.error('❌ Error sending welcome email:', error.message);
  }
};

// Send operator onboarding pending email
export const sendOperatorOnboardingPendingEmail = async (user) => {
  const mailOptions = {
    from: `"Overglow Trip" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: "⏳ Votre demande est en cours d'examen",
    html: getOperatorOnboardingPendingTemplate(user),
  };

  if (!transporter || !isEmailEnabled()) return;

  try {
    await sendMailWithRetry(mailOptions);
  } catch (error) {
    logger.error('❌ Error sending operator onboarding pending email:', error.message);
  }
};

// Send operator approved email
export const sendOperatorApprovedEmail = async (user) => {
  const mailOptions = {
    from: `"Overglow Trip" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: '🎉 Félicitations, votre compte est approuvé !',
    html: getOperatorApprovedTemplate(user),
  };

  if (!transporter || !isEmailEnabled()) return;

  try {
    await sendMailWithRetry(mailOptions);
  } catch (error) {
    logger.error('❌ Error sending operator approved email:', error.message);
  }
};

// Send circuit booking confirmation email
export const sendCircuitBookingConfirmation = async (bookings, user, paymentReference) => {
  if (!bookings || bookings.length === 0) return;

  // Création du HTML pour le circuit complet (E-ticket Premium)
  const itemsHtml = bookings.map(b => `
    <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #e5e7eb;">
      <h3 style="margin: 0 0 10px; color: #111827;">${b.schedule?.product?.title}</h3>
      <p style="margin: 5px 0; color: #4b5563;">📍 ${b.schedule?.product?.city}</p>
      <p style="margin: 5px 0; color: #4b5563;">📅 ${new Date(b.schedule?.date).toLocaleDateString('fr-FR')} à ${b.schedule?.time}</p>
      <p style="margin: 5px 0; color: #4b5563;">🎟️ ${b.numberOfTickets} billet(s)</p>
    </div>
  `).join('');

  const totalAmount = bookings.reduce((acc, curr) => acc + (curr.totalPrice || curr.totalAmount || 0), 0);

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1>Circuit Confirmé !</h1>
        <p>Merci pour votre confiance, ${user.name}</p>
      </div>
      <div style="padding: 20px; background-color: #f9fafb; border: 1px solid #e5e7eb;">
        <p>Votre circuit a été enregistré avec succès.</p>
        <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #6b7280; font-size: 14px;">Référence de paiement globale :</p>
          <p style="margin: 5px 0 0; font-weight: bold; font-size: 18px; color: #059669;">${paymentReference}</p>
        </div>
        <div style="margin-top: 30px;">
          <h2 style="color: #111827; border-bottom: 2px solid #059669; padding-bottom: 10px;">Votre Itinéraire</h2>
          ${itemsHtml}
        </div>
        <div style="margin-top: 20px; text-align: right;">
          <h2 style="color: #111827;">Total payé : ${totalAmount.toFixed(2)} €</h2>
        </div>
      </div>
    </div>
  `;

  const mailOptions = {
    from: `"Overglow Trip" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: '🌍 Votre circuit est confirmé - Overglow Trip',
    html: htmlContent,
  };

  if (!transporter || !isEmailEnabled()) {
    if (process.env.NODE_ENV === 'development') {
      logger.info('📧 [DEV] Email Circuit would be sent to:', user.email);
    }
    return;
  }

  try {
    await sendMailWithRetry(mailOptions);
    logger.info('✅ Circuit booking confirmation email sent to:', user.email);
  } catch (error) {
    logger.error('❌ Error sending circuit booking confirmation email:', error.message);
  }
};
