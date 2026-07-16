import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const MobileMenuContext = createContext(null);

export const MobileMenuProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  const value = useMemo(
    () => ({ isOpen, setIsOpen, open, close, toggle }),
    [isOpen, open, close, toggle]
  );

  return (
    <MobileMenuContext.Provider value={value}>{children}</MobileMenuContext.Provider>
  );
};

export const useMobileMenu = () => {
  const ctx = useContext(MobileMenuContext);
  if (!ctx) {
    return {
      isOpen: false,
      setIsOpen: () => {},
      open: () => {},
      close: () => {},
      toggle: () => {},
    };
  }
  return ctx;
};
