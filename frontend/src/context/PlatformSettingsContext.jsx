import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../config/axios';
import { useAuth } from './AuthContext';
import { logger } from '../utils/logger.js';

const PlatformSettingsContext = createContext({
  settings: {},
  loading: true,
  refresh: () => {},
});

const PUBLIC_KEYS = [
  'maintenanceMode',
  'defaultLanguage',
  'defaultCurrency',
  'bankTransferEnabled',
  'stripeEnabled',
  'paypalEnabled',
  'cmiEnabled',
  'showIban',
];

const OPERATOR_KEYS = [
  'platformCommissionPercent',
  'minWithdrawalAmountMad',
  'minWithdrawalDays',
  'transferFeeMad',
  'supportEmail',
];

/**
 * Charge les Settings plateforme (clés publiques + clés opérateur si connecté Host).
 * Admin utilise /api/settings (full) depuis AdminSettingsPage ; ici = consommation storefront/host.
 */
export const PlatformSettingsProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const role = user?.role;
      if (role === 'Admin' && isAuthenticated) {
        const { data } = await api.get('/api/settings');
        setSettings(data || {});
        return;
      }

      const keys = [...PUBLIC_KEYS];
      if (role === 'Opérateur' && isAuthenticated) {
        keys.push(...OPERATOR_KEYS);
      }

      const results = await Promise.allSettled(
        keys.map((key) => api.get(`/api/settings/${key}`))
      );
      const next = {};
      results.forEach((res, idx) => {
        if (res.status === 'fulfilled' && res.value?.data) {
          next[keys[idx]] = res.value.data.value;
        }
      });
      setSettings(next);
    } catch (err) {
      logger.error('Platform settings load failed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role, isAuthenticated]);

  const value = useMemo(
    () => ({ settings, loading, refresh }),
    [settings, loading]
  );

  return (
    <PlatformSettingsContext.Provider value={value}>
      {children}
    </PlatformSettingsContext.Provider>
  );
};

export const usePlatformSettings = () => useContext(PlatformSettingsContext);

export default PlatformSettingsContext;
