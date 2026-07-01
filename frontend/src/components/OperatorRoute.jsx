import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const normalizeRole = (role) => {
  if (!role) return '';
  const lower = String(role).trim().toLowerCase();
  if (lower === 'opérateur' || lower === 'operateur' || lower === 'operator') {
    return 'operator';
  }
  return lower;
};

const isOperatorUser = (user) => normalizeRole(user?.role) === 'operator';

const OperatorRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
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

  // Onboarding désactivé : les routes /operator/onboarding et /operator/wizard
  // ne sont pas exposées dans App.jsx — pas de redirection vers des pages inexistantes.
  return children;
};

export default OperatorRoute;
