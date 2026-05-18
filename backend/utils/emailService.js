import pkg from 'nodemailer';
const { createTransport } = pkg;
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
      secure: false,
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
        console.warn('⚠️  Email service not configured properly:', error.message);
        console.warn('📧 To enable emails, configure EMAIL_USER and EMAIL_PASS in .env');
        console.warn('📧 Or set EMAIL_ENABLED=false to disable email notifications');
        transporter = null;
      } else {
        console.log('✅ Email service configured successfully');
      }
    });
  } catch (error) {
    console.warn('⚠️  Failed to initialize email service:', error.message);
    transporter = null;
  }
} else {
  console.log('📧 Email service disabled (set EMAIL_ENABLED=false or configure EMAIL_USER/EMAIL_PASS)');
}

// Send booking confirmation email
export const sendBookingConfirmation = async (booking, user) => {
  const premium = getBookingConfirmationPremiumTemplate({ booking, user });
  const mailOptions = {
    from: `"Overglow Trip" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: premium.subject || '✅ Réservation confirmée - Overglow Trip',
    html: premium.html || getBookingConfirmationTemplate(booking, user),
  };

  // Skip if email is disabled or transporter not available
  if (!transporter || !isEmailEnabled()) {
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 [DEV] Email would be sent to:', user.email);
      console.log('📧 [DEV] Subject:', mailOptions.subject);
    }
    return;
  }

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Booking confirmation email sent to:', user.email);
  } catch (error) {
    // Don't throw error, just log it - email failure shouldn't break the booking
    console.error('❌ Error sending booking confirmation email:', error.message);
    if (error.code === 'EAUTH') {
      console.error('💡 Tip: For Gmail, use an App Password instead of your regular password');
      console.error('💡 See: https://support.google.com/accounts/answer/185833');
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
      console.log('📧 [DEV] Email would be sent to:', user.email);
      console.log('📧 [DEV] Subject:', mailOptions.subject);
    }
    return;
  }

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Cancellation email sent to:', user.email);
  } catch (error) {
    // Don't throw error, just log it - email failure shouldn't break the cancellation
    console.error('❌ Error sending cancellation email:', error.message);
    if (error.code === 'EAUTH') {
      console.error('💡 Tip: For Gmail, use an App Password instead of your regular password');
      console.error('💡 See: https://support.google.com/accounts/answer/185833');
    }
  }
};

// Send operator booking notification email
export const sendOperatorBookingNotification = async (booking, operator, user) => {
  // Get operator user email
  const User = (await import('../models/userModel.js')).default;
  const operatorUser = await User.findById(operator.user || operator);
  
  if (!operatorUser || !operatorUser.email) {
    console.warn('⚠️  Operator email not found, skipping email notification');
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
      console.log('📧 [DEV] Email would be sent to operator:', operatorUser.email);
      console.log('📧 [DEV] Subject:', mailOptions.subject);
    }
    return;
  }

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Operator booking notification email sent to:', operatorUser.email);
  } catch (error) {
    // Don't throw error, just log it - email failure shouldn't break the booking
    console.error('❌ Error sending operator booking notification email:', error.message);
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
      console.log('📧 [DEV] Email would be sent to:', user.email);
      console.log('📧 [DEV] Subject:', mailOptions.subject);
    }
    return;
  }

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Refund processed email sent to:', user.email);
  } catch (error) {
    console.error('❌ Error sending refund processed email:', error.message);
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
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('❌ Error sending welcome email:', error.message);
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
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('❌ Error sending operator onboarding pending email:', error.message);
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
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('❌ Error sending operator approved email:', error.message);
  }
};
