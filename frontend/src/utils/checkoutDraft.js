const DRAFT_KEY = 'overglow_checkout_draft_v1';

/**
 * Persiste le payload booking/checkout (location.state) pour survivre
 * aux redirects login / refresh / perte de state React Router.
 */
export function saveCheckoutDraft(payload) {
  if (!payload || typeof payload !== 'object') return;
  try {
    const data = {
      ...payload,
      savedAt: Date.now(),
    };
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  } catch {
    /* ignore quota / private mode */
  }
}

export function loadCheckoutDraft(maxAgeMs = 2 * 60 * 60 * 1000) {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data?.savedAt || Date.now() - data.savedAt > maxAgeMs) {
      sessionStorage.removeItem(DRAFT_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function clearCheckoutDraft() {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

/** Normalise un timeSlot produit (schedule.time ou { startTime }) */
export function resolveSlotTime(timeSlot) {
  if (!timeSlot) return '';
  if (typeof timeSlot === 'string') return timeSlot;
  return timeSlot.startTime || timeSlot.time || '';
}
