import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../config/axios';

const OperatorRoute = ({ children }) => {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const [onboardingStatus, setOnboardingStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!isAuthenticated || user?.role !== 'Opérateur') {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get('/api/operator/onboarding');
        setOnboardingStatus(data);
      } catch (error) {
        // If error, assume onboarding needs to be completed
        setOnboardingStatus({ onboardingStatus: 'in_progress', progress: 0 });
      } finally {
        setLoading(false);
      }
    };

    if (authLoading) return;
    checkOnboardingStatus();
  }, [isAuthenticated, user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'Opérateur') {
    return <Navigate to="/" replace />;
  }

  // Redirect to onboarding if not completed or not approved
  if (onboardingStatus && onboardingStatus.onboardingStatus !== 'approved') {
    return <Navigate to="/operator/onboarding" replace />;
  }

  return children;
};

export default OperatorRoute;

