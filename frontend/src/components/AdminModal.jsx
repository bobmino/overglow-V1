import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Modal admin : plein écran sur mobile, panneau centré sur desktop.
 */
const AdminModal = ({
  open,
  onClose,
  title,
  children,
  footer = null,
  maxWidthClass = 'max-w-2xl',
  labelledBy = 'admin-modal-title',
}) => {
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center md:items-center md:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Fermer"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={`relative flex w-full flex-col bg-white shadow-2xl
          max-md:h-full max-md:max-h-full max-md:rounded-none
          md:max-h-[90vh] md:rounded-2xl ${maxWidthClass}`}
      >
        <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between rounded-t-none bg-slate-900 px-4 py-4 text-white md:rounded-t-2xl md:px-6">
          <h2 id={labelledBy} className="truncate text-lg font-heading font-bold pe-3">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-slate-800 min-h-11 min-w-11 inline-flex items-center justify-center"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">{children}</div>
        {footer && (
          <div className="shrink-0 border-t border-gray-200 bg-white p-4 md:rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminModal;
