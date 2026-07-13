/**
 * [TASK-2] Vérification de signature des webhooks PayPal
 * via l'API officielle /v1/notifications/verify-webhook-signature.
 */
import { logger } from '../utils/logger.js';

const isProduction = () => process.env.NODE_ENV === 'production';

const getPaypalApiBase = () => {
  const useLive =
    isProduction() && String(process.env.PAYPAL_MODE || '').toLowerCase() === 'live';
  return useLive ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
};

let cachedToken = null;
let cachedTokenExpiresAt = 0;

/**
 * OAuth2 client-credentials token (cache court).
 */
export const getPaypalAccessToken = async () => {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials missing (PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET)');
  }

  const now = Date.now();
  if (cachedToken && now < cachedTokenExpiresAt - 30_000) {
    return cachedToken;
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await fetch(`${getPaypalApiBase()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) {
    logger.error('PayPal OAuth token failed', {
      status: response.status,
      error: data.error || data.error_description || data.message,
    });
    throw new Error('Failed to obtain PayPal access token');
  }

  cachedToken = data.access_token;
  cachedTokenExpiresAt = now + (Number(data.expires_in) || 300) * 1000;
  return cachedToken;
};

/**
 * Vérifie que l'URL du certificat appartient bien à PayPal.
 */
export const isTrustedPaypalCertUrl = (certUrl) => {
  try {
    const { protocol, hostname } = new URL(certUrl);
    if (protocol !== 'https:') return false;
    return hostname === 'api.paypal.com'
      || hostname === 'api.sandbox.paypal.com'
      || hostname.endsWith('.paypal.com');
  } catch {
    return false;
  }
};

/**
 * Vérifie la signature d'un webhook PayPal.
 * @returns {Promise<{ ok: true } | { ok: false, reason: string }>}
 */
export const verifyPaypalWebhookSignature = async ({ headers, body, webhookId }) => {
  if (!webhookId) {
    return { ok: false, reason: 'PAYPAL_WEBHOOK_ID is not configured' };
  }

  const transmissionId = headers['paypal-transmission-id'];
  const transmissionTime = headers['paypal-transmission-time'];
  const certUrl = headers['paypal-cert-url'];
  const authAlgo = headers['paypal-auth-algo'];
  const transmissionSig = headers['paypal-transmission-sig'];

  if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
    return { ok: false, reason: 'Missing PayPal transmission headers' };
  }

  if (!isTrustedPaypalCertUrl(certUrl)) {
    return { ok: false, reason: 'Untrusted PayPal-Cert-URL host' };
  }

  const webhookEvent = typeof body === 'string' || Buffer.isBuffer(body)
    ? JSON.parse(body.toString())
    : body;

  if (!webhookEvent || typeof webhookEvent !== 'object') {
    return { ok: false, reason: 'Invalid webhook event body' };
  }

  try {
    const accessToken = await getPaypalAccessToken();
    const response = await fetch(`${getPaypalApiBase()}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auth_algo: authAlgo,
        cert_url: certUrl,
        transmission_id: transmissionId,
        transmission_sig: transmissionSig,
        transmission_time: transmissionTime,
        webhook_id: webhookId,
        webhook_event: webhookEvent,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      logger.error('PayPal verify-webhook-signature HTTP error', {
        status: response.status,
        data,
      });
      return { ok: false, reason: `PayPal verify API error (${response.status})` };
    }

    if (data.verification_status !== 'SUCCESS') {
      logger.error('PayPal webhook signature rejected', {
        verification_status: data.verification_status,
        transmissionId,
      });
      return {
        ok: false,
        reason: `verification_status=${data.verification_status || 'UNKNOWN'}`,
      };
    }

    return { ok: true };
  } catch (error) {
    logger.error('PayPal webhook verification exception', { message: error.message });
    return { ok: false, reason: error.message || 'Verification failed' };
  }
};

/**
 * Extrait le montant capturé depuis un event PayPal.
 */
export const extractPaypalWebhookAmount = (event) => {
  const resource = event?.resource || {};
  const amountValue =
    resource.amount?.value
    || resource.seller_receivable_breakdown?.gross_amount?.value
    || resource.purchase_units?.[0]?.amount?.value
    || null;
  return amountValue == null ? null : Number(amountValue);
};

export default {
  getPaypalAccessToken,
  isTrustedPaypalCertUrl,
  verifyPaypalWebhookSignature,
  extractPaypalWebhookAmount,
};
