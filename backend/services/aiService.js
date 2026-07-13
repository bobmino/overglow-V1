import axios from 'axios';
import { logger } from '../utils/logger.js';

/**
 * [TASK-5] Credentials AI uniquement via environnement (plus aucune URL/clé hardcodée).
 */
export const getAiConfig = () => {
  const baseUrl = process.env.AI_SERVICE_URL?.trim();
  const apiKey = process.env.AI_API_KEY?.trim();
  const model = process.env.AI_MODEL?.trim() || 'llama3.1';

  if (!baseUrl) {
    throw new Error('AI_SERVICE_URL is not configured');
  }
  if (!apiKey) {
    throw new Error('AI_API_KEY is not configured');
  }

  return { baseUrl, apiKey, model };
};

/**
 * Validation au démarrage — warning si absents (AI optionnel hors chat).
 * Les credentials hardcodés historiques (localtunnel) doivent être considérés comme compromis → ROTATE.
 */
export const validateAiEnvAtStartup = () => {
  const missing = [];
  if (!process.env.AI_SERVICE_URL?.trim()) missing.push('AI_SERVICE_URL');
  if (!process.env.AI_API_KEY?.trim()) missing.push('AI_API_KEY');

  if (missing.length) {
    logger.warn(
      `[aiEnv] Missing ${missing.join(', ')} — AI endpoints will return 503 until configured. ` +
        'If this repo was public, rotate any previously hardcoded AI keys immediately.'
    );
    return { ok: false, missing };
  }

  logger.info('[aiEnv] AI environment variables OK (values not logged)');
  return { ok: true, missing: [] };
};

/**
 * Génère une réponse IA via le service configuré.
 * @param {string} prompt
 * @returns {Promise<Object>}
 */
export const generateAIResponse = async (prompt) => {
  const { baseUrl, apiKey, model } = getAiConfig();

  try {
    const endpoint = baseUrl.replace(/\/$/, '');
    const url = endpoint.endsWith('/chat/completions')
      ? endpoint
      : `${endpoint}/v1/chat/completions`;

    const response = await axios.post(
      url,
      {
        model,
        messages: [{ role: 'user', content: prompt }],
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 60_000,
      }
    );

    return { ...response.data, model };
  } catch (error) {
    logger.error('AI response generation failed', {
      message: error.message,
      status: error.response?.status,
    });
    throw error;
  }
};

export default {
  getAiConfig,
  validateAiEnvAtStartup,
  generateAIResponse,
};
