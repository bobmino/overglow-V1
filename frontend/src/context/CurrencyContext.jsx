import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CurrencyContext = createContext(null);

// Valeurs par défaut si aucune API FX n'est dispo (alignées sur convert-to-mad du backend)
const DEFAULT_RATES = {
  MAD: 1,
  EUR: 1 / 10.8,
  USD: 1 / 10,
};

export const CurrencyProvider = ({ children }) => {
  const [selectedCurrency, setSelectedCurrency] = useState('EUR');
  const [rates, setRates] = useState(DEFAULT_RATES);
  const [baseCurrency] = useState('MAD'); // Base interne pour calcul

  // En production on pourrait fetch une API FX ici
  useEffect(() => {
    // TODO: brancher une vraie API FX si clé dispo
    setRates(DEFAULT_RATES);
  }, []);

  const convert = (amount, from = 'EUR', to = selectedCurrency) => {
    if (!amount || Number.isNaN(Number(amount))) return 0;
    const fromRate = rates[from] ?? 1;
    const toRate = rates[to] ?? 1;
    // Convertir vers base MAD puis vers cible
    const madAmount = Number(amount) / fromRate;
    return madAmount * toRate;
  };

  const formatPrice = (amount, from = 'EUR', opts = {}) => {
    const value = convert(amount, from, selectedCurrency);
    const currencyDisplay = selectedCurrency === 'MAD' ? 'MAD' : selectedCurrency;
    const minimumFractionDigits = selectedCurrency === 'MAD' ? 0 : 2;
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currencyDisplay,
      minimumFractionDigits,
      maximumFractionDigits: minimumFractionDigits,
      ...opts,
    }).format(value);
  };

  const value = useMemo(
    () => ({
      selectedCurrency,
      setSelectedCurrency,
      rates,
      convert,
      formatPrice,
      baseCurrency,
    }),
    [selectedCurrency, rates]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

export const useCurrency = () => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return ctx;
};

