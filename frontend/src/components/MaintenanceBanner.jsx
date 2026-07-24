import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { usePlatformSettings } from '../context/PlatformSettingsContext';
import { useAuth } from '../context/AuthContext';
import LocalizedLink from './LocalizedLink';

/**
 * Bannière maintenance si Settings.maintenanceMode — bypass Admin / Opérateur.
 */
const MaintenanceBanner = () => {
  const { settings, loading } = usePlatformSettings();
  const { user } = useAuth();
  const location = useLocation();

  if (loading || !settings.maintenanceMode) return null;

  const isStaff = user?.role === 'Admin' || user?.role === 'Opérateur';
  const authPath =
    location.pathname.startsWith('/login') ||
    location.pathname.startsWith('/register') ||
    location.pathname.startsWith('/reset-password');

  if (isStaff) {
    return (
      <div className="bg-amber-50 border-b border-amber-200 text-amber-950 px-4 py-2.5 text-sm flex items-center gap-2 justify-center sticky top-0 z-[90]">
        <AlertTriangle size={16} className="text-secondary-600 shrink-0" />
        <span>
          Mode maintenance actif — les visiteurs voient une page d’indisponibilité. Vous y avez accès car vous êtes connecté en staff.
        </span>
      </div>
    );
  }

  if (authPath) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-primary-950 text-white flex flex-col items-center justify-center px-6 text-center">
      <AlertTriangle size={40} className="text-secondary-500 mb-4" />
      <p className="text-xs uppercase tracking-[0.2em] text-primary-300 mb-2">Overglow</p>
      <h1 className="text-3xl font-heading font-bold mb-3">Maintenance en cours</h1>
      <p className="text-primary-100/90 max-w-md mb-8">
        Notre plateforme est temporairement indisponible. Merci de réessayer dans quelques minutes.
      </p>
      <LocalizedLink
        to="/login"
        className="inline-flex px-5 py-2.5 rounded-full bg-white text-primary-900 font-bold text-sm hover:bg-primary-50 transition"
      >
        Accès staff
      </LocalizedLink>
    </div>
  );
};

export default MaintenanceBanner;
