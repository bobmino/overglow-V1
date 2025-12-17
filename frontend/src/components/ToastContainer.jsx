import React from 'react';
import { useToast } from '../context/ToastContext';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const iconByType = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const stylesByType = {
  success: 'border-green-200 bg-green-50 text-green-800',
  error: 'border-red-200 bg-red-50 text-red-800',
  info: 'border-slate-200 bg-white text-slate-800',
};

const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed z-[60] top-20 right-4 left-4 sm:left-auto sm:w-[420px] space-y-3">
      {toasts.map((t) => {
        const Icon = iconByType[t.type] || Info;
        const style = stylesByType[t.type] || stylesByType.info;

        return (
          <div
            key={t.id}
            className={`w-full border rounded-xl shadow-lg px-4 py-3 flex items-start gap-3 ${style}`}
            role="status"
            aria-live="polite"
          >
            <Icon size={18} className="mt-0.5 flex-shrink-0" />
            <div className="text-sm font-semibold leading-snug flex-1">{t.message}</div>
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              className="p-1 rounded-lg hover:bg-black/5 transition"
              aria-label="Fermer"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;


