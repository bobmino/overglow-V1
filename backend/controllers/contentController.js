import { getAboutContent, getCultureContent } from '../data/editorialContent.js';
import { resolveRequestLang, SUPPORTED_LANGS } from '../utils/contentI18n.js';
import { logger } from '../utils/logger.js';

// @desc    Editorial about page content
// @route   GET /api/content/about?lang=fr
export const getAboutPage = async (req, res) => {
  try {
    const lang = resolveRequestLang(req);
    res.json({
      lang,
      supportedLangs: SUPPORTED_LANGS,
      content: getAboutContent(lang),
    });
  } catch (error) {
    logger.error('getAboutPage error:', error);
    res.status(500).json({ message: 'Failed to load about content' });
  }
};

// @desc    Moroccan culture editorial content
// @route   GET /api/content/culture?lang=fr
export const getCulturePage = async (req, res) => {
  try {
    const lang = resolveRequestLang(req);
    const data = getCultureContent(lang);
    res.json({
      lang: data.lang,
      supportedLangs: SUPPORTED_LANGS,
      sections: data.sections,
      authenticityTags: data.authenticityTags,
    });
  } catch (error) {
    logger.error('getCulturePage error:', error);
    res.status(500).json({ message: 'Failed to load culture content' });
  }
};

// @desc    List supported content languages
// @route   GET /api/content/langs
export const getContentLangs = async (_req, res) => {
  res.json({ langs: SUPPORTED_LANGS });
};
