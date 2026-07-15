/**
 * [PROMPT-18] Admin email template preview + test send
 */
import { validationResult } from 'express-validator';
import {
  EMAIL_TEMPLATE_META,
  renderEmailTemplate,
  getSampleData,
} from '../utils/emailTemplateRenderer.js';
import { sendRawHtmlEmail } from '../utils/emailService.js';
import { logger } from '../utils/logger.js';

export const listEmailTemplates = async (req, res) => {
  res.json({
    templates: EMAIL_TEMPLATE_META,
  });
};

export const previewEmailTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const locale = req.query.locale === 'en' ? 'en' : 'fr';
    const rendered = renderEmailTemplate(id, getSampleData(id), locale);
    res.json({
      id,
      locale: rendered.locale,
      subject: rendered.subject,
      html: rendered.html,
    });
  } catch (error) {
    logger.error('Email preview error:', error.message);
    res.status(400).json({ message: error.message || 'Preview failed' });
  }
};

export const sendTestEmailTemplate = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const locale = req.body?.locale === 'en' ? 'en' : 'fr';
    const to = String(req.body?.email || req.user?.email || '').trim().toLowerCase();
    if (!to) {
      return res.status(400).json({ message: 'Email destinataire requis' });
    }

    const rendered = renderEmailTemplate(id, getSampleData(id), locale);
    await sendRawHtmlEmail({
      to,
      subject: `[TEST] ${rendered.subject}`,
      html: rendered.html,
    });

    res.json({
      message: `Email de test envoyé à ${to}`,
      subject: rendered.subject,
    });
  } catch (error) {
    logger.error('Test email error:', error.message);
    res.status(500).json({
      message: error.message || 'Échec de l’envoi du test (vérifiez la config SMTP)',
    });
  }
};
