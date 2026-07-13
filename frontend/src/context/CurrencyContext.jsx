import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { trackCurrencyChange } from '../utils/analytics';

const CurrencyContext = createContext(null);

const DEFAULT_RATES = {
  MAD: 1,
  EUR: 1 / 10.8,
  USD: 1 / 10,
};

const LOCALE_BY_LANG = {
  fr: 'fr-FR',
  en: 'en-GB',
  es: 'es-ES',
  ar: 'ar-MA',
};

export const CurrencyProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const [selectedCurrency, setSelectedCurrency] = useState('EUR');
  const [rates, setRates] = useState(DEFAULT_RATES);
  const [baseCurrency] = useState('MAD');

  useEffect(() => {
    setRates(DEFAULT_RATES);
  }, []);

  const handleCurrencyChange = (newCurrency) => {
    setSelectedCurrency(newCurrency);
    trackCurrencyChange(newCurrency);
  };

  const convert = (amount, from = 'EUR', to = selectedCurrency) => {
    if (!amount || Number.isNaN(Number(amount))) return 0;
    const fromRate = rates[from] ?? 1;
    const toRate = rates[to] ?? 1;
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
        if (decPart <= 0.15) roundedDec = 0.0;
        else if (decPart <= 0.55) roundedDec = 0.49;
        else roundedDec = 0.99;
        return intPart + roundedDec;
      }
      return price;
    }

    value = getPsychologicalPrice(value, selectedCurrency);

    const lang = (i18n.language || 'fr').slice(0, 2);
    const locale = LOCALE_BY_LANG[lang] || 'fr-FR';

    return new Intl.NumberFormat(locale, {
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
    [selectedCurrency, rates, i18n.language]
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
