import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../config/axios';

const normalizeRole = (role) => {
  if (!role) return '';
  const lower = String(role).trim().toLowerCase();
  if (lower === 'opérateur' || lower === 'operateur' || lower === 'operator') {
    return 'operator';
  }
  return lower;
};

const isOperatorUser = (user) => normalizeRole(user?.role) === 'operator';

const WIZARD_PATHS = ['/operator/wizard', '/operator/onboarding'];

const OperatorRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();
  const [wizardCheck, setWizardCheck] = useState({ loading: true, completed: true });

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!isAuthenticated || !isOperatorUser(user)) {
        if (!cancelled) setWizardCheck({ loading: false, completed: true });
        return;
      }
      if (WIZARD_PATHS.some((p) => location.pathname.startsWith(p))) {
        if (!cancelled) setWizardCheck({ loading: false, completed: true });
        return;
      }
      try {
        const { data } = await api.get('/api/operator/wizard/status');
        if (!cancelled) {
          const statusOk = ['Approved', 'Active', 'Under Review'].includes(data?.status);
          setWizardCheck({
            loading: false,
            completed: Boolean(data?.isFormCompleted) || statusOk,
          });
        }
      } catch {
        // Pas de profil / 404 → forcer le wizard
        if (!cancelled) setWizardCheck({ loading: false, completed: false });
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user, location.pathname]);

  if (loading || (isAuthenticated && isOperatorUser(user) && wizardCheck.loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-700" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isOperatorUser(user)) {
    const role = normalizeRole(user?.role);
    if (role === 'admin' || role === 'administrator' || role === 'superadmin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  if (
    !wizardCheck.completed
    && !WIZARD_PATHS.some((p) => location.pathname.startsWith(p))
  ) {
    return <Navigate to="/operator/wizard" replace />;
  }

  return children;
};

export default OperatorRoute;
