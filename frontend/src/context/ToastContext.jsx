import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);

const DEFAULT_DURATION = 2500;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message, options = {}) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const type = options.type || 'info'; // info | success | error
      const duration = Number.isFinite(options.duration) ? options.duration : DEFAULT_DURATION;

      setToasts((prev) => [...prev, { id, message, type }]);

      window.setTimeout(() => removeToast(id), duration);
      return id;
    },
    [removeToast]
  );

  const value = useMemo(() => ({ toast, toasts, removeToast }), [toast, toasts, removeToast]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
};


