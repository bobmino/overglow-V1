/**
 * Cookie consent helpers (GDPR).
 * Storage keys shared with CookieConsentPage.
 */

export const COOKIE_PREFS_KEY = 'overglow_cookie_prefs';
export const COOKIE_DECISION_KEY = 'overglow_cookie_decision';

export const DEFAULT_COOKIE_PREFS = {
  essential: true,
  analytics: false,
  marketing: false,
};

export const hasCookieDecision = () => {
  if (typeof window === 'undefined') return true;
  try {
    return localStorage.getItem(COOKIE_DECISION_KEY) === '1';
  } catch {
    return false;
  }
};

export const getCookiePrefs = () => {
  if (typeof window === 'undefined') return { ...DEFAULT_COOKIE_PREFS };
  try {
    const raw = localStorage.getItem(COOKIE_PREFS_KEY);
    if (!raw) return { ...DEFAULT_COOKIE_PREFS };
    return { ...DEFAULT_COOKIE_PREFS, ...JSON.parse(raw), essential: true };
  } catch {
    return { ...DEFAULT_COOKIE_PREFS };
  }
};

export const saveCookiePrefs = (prefs) => {
  const next = { ...DEFAULT_COOKIE_PREFS, ...prefs, essential: true };
  try {
    localStorage.setItem(COOKIE_PREFS_KEY, JSON.stringify(next));
    localStorage.setItem(COOKIE_DECISION_KEY, '1');
  } catch {
    /* ignore */
  }
  return next;
};

export const canUseAnalytics = () => {
  if (!hasCookieDecision()) return false;
  return Boolean(getCookiePrefs().analytics);
};

/** Notify analytics layer that prefs changed */
export const applyCookiePrefs = (prefs) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('overglow:cookie-prefs', { detail: prefs })
  );
};
