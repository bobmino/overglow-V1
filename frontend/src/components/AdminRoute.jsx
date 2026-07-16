import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const normalizeRole = (role) => {
  if (!role) return '';
  const lower = String(role).trim().toLowerCase();
  if (lower === 'admin' || lower === 'administrator' || lower === 'superadmin') {
    return 'admin';
  }
  return lower;
};

const isAdminUser = (user) => normalizeRole(user?.role) === 'admin';

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-700"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdminUser(user)) {
    const role = normalizeRole(user?.role);
    if (role === 'opérateur' || role === 'operateur' || role === 'operator') {
      return <Navigate to="/operator/dashboard" replace />;
    }
    if (role === 'client' || role === 'user' || role === 'customer' || role === 'voyageur') {
      return <Navigate to="/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;
