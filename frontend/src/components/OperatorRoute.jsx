import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../config/axios';

const OperatorRoute = ({ children }) => {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const [onboardingStatus, setOnboardingStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const isOperator = (() => {
    const role = (user?.role || '').toString().toLowerCase();
    return role === 'opérateur' || role === 'operateur' || role === 'operator';
  })();

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!isAuthenticated || !isOperator) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get('/api/operator/onboarding');
        setOnboardingStatus(data);
      } catch (error) {
        // Log error for debugging
        console.error('OperatorRoute - Onboarding check error:', {
          status: error.response?.status,
          message: error.response?.data?.message || error.message,
          url: error.config?.url
        });
        
        // If 401 (unauthorized), might be token issue - allow access and let refresh token handle it
        if (error.response?.status === 401) {
          console.warn('OperatorRoute - 401 error, allowing access (token refresh will handle)');
          setOnboardingStatus(null); // Don't block access
        } else if (error.response?.status === 404) {
          // No onboarding record found - assume needs to be completed
          setOnboardingStatus({ onboardingStatus: 'in_progress', progress: 0 });
        } else {
          // Other errors - don't block access, assume approved
          console.warn('OperatorRoute - Error checking onboarding, allowing access');
          setOnboardingStatus(null);
        }
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

  if (!isOperator) {
    return <Navigate to="/" replace />;
  }

  // Redirect to onboarding only if status is explicitly set and not approved
  // Don't redirect if onboardingStatus is null (error case or not checked yet)
  if (onboardingStatus && onboardingStatus.onboardingStatus && onboardingStatus.onboardingStatus !== 'approved') {
    return <Navigate to="/operator/onboarding" replace />;
  }

  return children;
};

export default OperatorRoute;

