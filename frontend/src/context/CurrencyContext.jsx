import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { trackCurrencyChange } from '../utils/analytics';

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

  // Wrapper for setSelectedCurrency with tracking
  const handleCurrencyChange = (newCurrency) => {
    setSelectedCurrency(newCurrency);
    trackCurrencyChange(newCurrency);
  };

  const convert = (amount, from = 'EUR', to = selectedCurrency) => {
    if (!amount || Number.isNaN(Number(amount))) return 0;
    const fromRate = rates[from] ?? 1;
    const toRate = rates[to] ?? 1;
    // Convertir vers base MAD puis vers cible
    const madAmount = Number(amount) / fromRate;
    return madAmount * toRate;
  };

  const formatPrice = (amount, from = 'EUR', opts = {}) => {
    let value = convert(amount, from, selectedCurrency);
    const currencyDisplay = selectedCurrency === 'MAD' ? 'MAD' : selectedCurrency;
    const minimumFractionDigits = selectedCurrency === 'MAD' ? 0 : 2;

    function getPsychologicalPrice(price, currency) {
      if (currency === 'MAD') {
        return Math.round(price);
      }
      if (currency === 'EUR' || currency === 'USD') {
        const intPart = Math.floor(price);
        const decPart = price - intPart;
        let roundedDec = 0.99;
        if (decPart <= 0.15) roundedDec = 0.00;
        else if (decPart <= 0.55) roundedDec = 0.49;
        else roundedDec = 0.99;
        return intPart + roundedDec;
      }
      return price;
    }

    value = getPsychologicalPrice(value, selectedCurrency);

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
      setSelectedCurrency: handleCurrencyChange,
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

