/**
 * Non-blocking user feedback (replaces alert()).
 * Requires ToastProvider listening for `app-toast`.
 */
export function notify(message, type = 'info', duration) {
  if (typeof window === 'undefined' || !message) return;
  window.dispatchEvent(
    new CustomEvent('app-toast', {
      detail: { message: String(message), type, duration },
    })
  );
}

export const notifySuccess = (message, duration) => notify(message, 'success', duration);
export const notifyError = (message, duration) => notify(message, 'error', duration);
export const notifyInfo = (message, duration) => notify(message, 'info', duration);

/**
 * Confirm dialog without native confirm() — Promise-based overlay.
 */
export function askConfirm(message, { confirmLabel = 'OK', cancelLabel = 'Cancel' } = {}) {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve(false);
      return;
    }

    const overlay = document.createElement('div');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.style.cssText =
      'position:fixed;inset:0;z-index:99999;background:rgba(15,23,42,.45);display:flex;align-items:center;justify-content:center;padding:16px;';

    const box = document.createElement('div');
    box.style.cssText =
      'max-width:420px;width:100%;background:#fff;border-radius:16px;padding:20px;box-shadow:0 20px 50px rgba(0,0,0,.2);';

    const p = document.createElement('p');
    p.textContent = message;
    p.style.cssText = 'margin:0 0 16px;color:#0f172a;font-size:15px;line-height:1.5;';

    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:8px;justify-content:flex-end;';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.textContent = cancelLabel;
    cancelBtn.style.cssText =
      'padding:8px 14px;border-radius:10px;border:1px solid #e2e8f0;background:#fff;font-weight:600;cursor:pointer;';

    const okBtn = document.createElement('button');
    okBtn.type = 'button';
    okBtn.textContent = confirmLabel;
    okBtn.style.cssText =
      'padding:8px 14px;border-radius:10px;border:none;background:#059669;color:#fff;font-weight:600;cursor:pointer;';

    const cleanup = (result) => {
      overlay.remove();
      resolve(result);
    };

    cancelBtn.onclick = () => cleanup(false);
    okBtn.onclick = () => cleanup(true);
    overlay.onclick = (e) => {
      if (e.target === overlay) cleanup(false);
    };

    row.appendChild(cancelBtn);
    row.appendChild(okBtn);
    box.appendChild(p);
    box.appendChild(row);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    okBtn.focus();
  });
}

/**
 * Text prompt without native prompt() — Promise resolves to string or null.
 */
export function askText(message, { placeholder = '', defaultValue = '', submitLabel = 'OK', cancelLabel = 'Cancel' } = {}) {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve(null);
      return;
    }

    const overlay = document.createElement('div');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.style.cssText =
      'position:fixed;inset:0;z-index:99999;background:rgba(15,23,42,.45);display:flex;align-items:center;justify-content:center;padding:16px;';

    const box = document.createElement('div');
    box.style.cssText =
      'max-width:420px;width:100%;background:#fff;border-radius:16px;padding:20px;box-shadow:0 20px 50px rgba(0,0,0,.2);';

    const p = document.createElement('p');
    p.textContent = message;
    p.style.cssText =
      'margin:0 0 12px;color:#0f172a;font-size:15px;line-height:1.5;white-space:pre-wrap;';

    const input = document.createElement('input');
    input.type = 'text';
    input.value = defaultValue;
    input.placeholder = placeholder;
    input.style.cssText =
      'width:100%;padding:10px 12px;border:1px solid #cbd5e1;border-radius:10px;margin-bottom:16px;font-size:14px;box-sizing:border-box;';

    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:8px;justify-content:flex-end;';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.textContent = cancelLabel;
    cancelBtn.style.cssText =
      'padding:8px 14px;border-radius:10px;border:1px solid #e2e8f0;background:#fff;font-weight:600;cursor:pointer;';

    const okBtn = document.createElement('button');
    okBtn.type = 'button';
    okBtn.textContent = submitLabel;
    okBtn.style.cssText =
      'padding:8px 14px;border-radius:10px;border:none;background:#059669;color:#fff;font-weight:600;cursor:pointer;';

    const cleanup = (result) => {
      overlay.remove();
      resolve(result);
    };

    cancelBtn.onclick = () => cleanup(null);
    okBtn.onclick = () => cleanup(input.value);
    input.onkeydown = (e) => {
      if (e.key === 'Enter') cleanup(input.value);
      if (e.key === 'Escape') cleanup(null);
    };
    overlay.onclick = (e) => {
      if (e.target === overlay) cleanup(null);
    };

    row.appendChild(cancelBtn);
    row.appendChild(okBtn);
    box.appendChild(p);
    box.appendChild(input);
    box.appendChild(row);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    input.focus();
  });
}
