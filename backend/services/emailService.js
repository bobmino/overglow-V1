import { Resend } from 'resend';
import dotenv from 'dotenv';
import { logger } from '../utils/logger.js';

dotenv.config();

let resend = null;

const getResendClient = () => {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
};

const formatDate = (rawDate) => {
  if (!rawDate) return 'À confirmer';
  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) return 'À confirmer';
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatAmount = (value) => {
  const amount = Number(value || 0);
  return `€${amount.toFixed(2)}`;
};

export const getBookingConfirmationPremiumTemplate = ({ booking, user, whatsappLink }) => {
  const productTitle = booking?.schedule?.product?.title || booking?.product?.title || 'Votre expérience Overglow';
  const bookingRef = booking?._id ? `#${booking._id.toString().slice(-8).toUpperCase()}` : 'À CONFIRMER';
  const guideWhatsapp = whatsappLink || booking?.schedule?.product?.operatorWhatsapp || booking?.product?.operatorWhatsapp || '';
  const whatsappUrl = guideWhatsapp
    ? `https://wa.me/${String(guideWhatsapp).replace(/\D+/g, '')}`
    : null;

  const html = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Votre Confirmation Overglow</title>
      <style>
        @media only screen and (max-width: 600px) {
          .container { width: 100% !important; padding: 20px !important; }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #fafafa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fafafa; padding: 40px 0;">
        <tr>
          <td align="center">
            <table class="container" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border: 1px solid #eaeaea; border-radius: 0px; padding: 40px; text-align: left;">
              <!-- Header -->
              <tr>
                <td style="padding-bottom: 40px; border-bottom: 1px solid #eaeaea;">
                  <span style="font-size: 24px; font-weight: 800; letter-spacing: 6px; text-transform: uppercase; color: #000000; font-family: Georgia, serif;">OVERGLOW</span>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding: 40px 0 30px 0;">
                  <h1 style="margin: 0 0 16px 0; font-size: 26px; font-weight: 400; color: #000000; font-family: Georgia, serif; line-height: 1.3;">Réservation Confirmée.</h1>
                  <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #404040;">
                    Bonjour ${user?.name || 'Voyageur'},<br><br>
                    Votre demande de réservation a été validée avec succès. Vous trouverez ci-dessous votre e-ticket avec tous les détails de votre expérience.
                  </p>
                </td>
              </tr>
              <!-- Ticket Box -->
              <tr>
                <td style="padding-bottom: 30px;">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fcfcfc; border: 1px solid #000000; padding: 24px;">
                    <tr>
                      <td style="font-size: 14px; text-transform: uppercase; letter-spacing: 2px; color: #737373; font-weight: 600; padding-bottom: 8px;">
                        Expérience
                      </td>
                    </tr>
                    <tr>
                      <td style="font-size: 18px; font-weight: 600; color: #000000; padding-bottom: 20px; font-family: Georgia, serif;">
                        ${productTitle}
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                          <tr>
                            <td width="50%" style="padding-bottom: 15px; font-size: 14px; color: #404040;">
                              <strong style="color: #000000;">Date :</strong><br>
                              ${formatDate(booking?.schedule?.date || booking?.date)}
                            </td>
                            <td width="50%" style="padding-bottom: 15px; font-size: 14px; color: #404040;">
                              <strong style="color: #000000;">Heure :</strong><br>
                              ${booking?.schedule?.time || booking?.time || 'À confirmer'}
                            </td>
                          </tr>
                          <tr>
                            <td width="50%" style="font-size: 14px; color: #404040;">
                              <strong style="color: #000000;">Billets :</strong><br>
                              ${booking?.numberOfTickets || 1}
                            </td>
                            <td width="50%" style="font-size: 14px; color: #404040;">
                              <strong style="color: #000000;">Référence :</strong><br>
                              <span style="font-family: monospace; font-size: 13px; font-weight: bold; background-color: #f0f0f0; padding: 2px 6px; border-radius: 3px;">${bookingRef}</span>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-top: 25px; border-top: 1px solid #eaeaea; font-size: 16px; font-weight: 600; color: #000000;">
                        Montant Total : ${formatAmount(booking?.totalAmount)}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <!-- Call to action -->
              ${
                whatsappUrl
                  ? `<tr>
                      <td style="padding: 10px 0 30px 0; align-items: center;">
                        <a href="${whatsappUrl}" style="display: block; text-align: center; background-color: #000000; color: #ffffff; text-decoration: none; padding: 15px 25px; font-size: 14px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; border-radius: 0px;">
                          Contacter le guide WhatsApp
                        </a>
                      </td>
                    </tr>`
                  : ''
              }
              <!-- Footer Info -->
              <tr>
                <td style="padding-top: 30px; border-top: 1px solid #eaeaea; font-size: 12px; line-height: 1.5; color: #737373; text-align: center;">
                  Cet email fait office de confirmation officielle et d'e-ticket d'embarquement.<br>
                  Pour toute question, veuillez répondre directement à cet email.<br><br>
                  <strong style="color: #000000; letter-spacing: 2px; text-transform: uppercase;">Overglow Travel</strong>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;

  return {
    subject: `Votre confirmation Overglow - ${bookingRef}`,
    html,
  };
};

export const sendBookingConfirmationEmail = async ({ to, booking, user, whatsappLink }) => {
  const client = getResendClient();
  if (!client) {
    logger.warn('[Resend Email] RESEND_API_KEY not configured — skipping confirmation email');
    return { success: false, skipped: true };
  }

  const { subject, html } = getBookingConfirmationPremiumTemplate({ booking, user, whatsappLink });
  const fromEmail = process.env.RESEND_FROM || 'onboarding@resend.dev';

  try {
    const data = await client.emails.send({
      from: `Overglow <${fromEmail}>`,
      to: [to],
      subject: subject,
      html: html,
    });
    logger.info(`[Resend Email] Email de confirmation envoyé avec succès à ${to} :`, data);
    return { success: true, data };
  } catch (error) {
    logger.error(`[Resend Email Error] Échec de l'envoi de l'email de confirmation à ${to} :`, error);
    throw error;
  }
};
