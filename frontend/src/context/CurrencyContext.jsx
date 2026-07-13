import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../config/axios';
import { trackCurrencyChange } from '../utils/analytics';
import { logger } from '../utils/logger.js';

const CurrencyContext = createContext(null);

/** Rates as MAD→currency multipliers (amount_in_MAD * rate = amount_in_currency). */
const DEFAULT_RATES = {
  MAD: 1,
  EUR: 1 / 10.8,
  USD: 1 / 10,
  GBP: 1 / 13.5,
};

const CACHE_KEY = 'overglow_fx_rates_v1';
const TTL_MS = 60 * 60 * 1000; // 1 hour

const LOCALE_BY_LANG = {
  fr: 'fr-FR',
  en: 'en-GB',
  es: 'es-ES',
  ar: 'ar-MA',
};

const readLocalCache = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.rates || !parsed?.timestamp) return null;
    if (Date.now() - parsed.timestamp > TTL_MS) return null;
    return parsed.rates;
  } catch {
    return null;
  }
};

const writeLocalCache = (rates) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ rates, timestamp: Date.now() }));
  } catch {
    // ignore quota / private mode
  }
};

/**
 * Build MAD→currency rates from convert-to-mad exchangeRate (currency→MAD).
 * rateToMAD = EUR→MAD; rateMadToCurrency = 1 / rateToMAD.
 */
const ratesFromToMad = (pairs) => {
  const next = { ...DEFAULT_RATES };
  for (const [code, rateToMad] of Object.entries(pairs)) {
    const n = Number(rateToMad);
    if (!Number.isFinite(n) || n <= 0) continue;
    next[code.toUpperCase()] = code.toUpperCase() === 'MAD' ? 1 : 1 / n;
  }
  return next;
};

export const CurrencyProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const [selectedCurrency, setSelectedCurrency] = useState('EUR');
  const [rates, setRates] = useState(() => readLocalCache() || DEFAULT_RATES);
  const [baseCurrency] = useState('MAD');

  useEffect(() => {
    let cancelled = false;

    const loadRates = async () => {
      const cached = readLocalCache();
      if (cached) {
        logger.debug('FX client cache hit');
        if (!cancelled) setRates(cached);
        return;
      }

      logger.debug('FX client cache miss — fetching');
      try {
        const currencies = ['EUR', 'USD', 'GBP'];
        const results = await Promise.all(
          currencies.map(async (from) => {
            const { data } = await api.get('/api/payments/convert-to-mad', {
              params: { amount: 1, from },
            });
            return [from, data?.exchangeRate];
          })
        );

        const pairs = { MAD: 1 };
        for (const [from, rate] of results) {
          if (rate != null) pairs[from] = rate;
        }

        const next = ratesFromToMad(pairs);
        writeLocalCache(next);
        if (!cancelled) setRates(next);
      } catch (err) {
        logger.warn('FX fetch failed — using fallback rates', { message: err?.message });
        if (!cancelled) setRates(DEFAULT_RATES);
      }
    };

    loadRates();
    return () => {
      cancelled = true;
    };
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
