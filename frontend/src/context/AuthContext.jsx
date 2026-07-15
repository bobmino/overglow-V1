import React, { createContext, useState, useContext, useEffect } from 'react';
import { setSentryUser, clearSentryUser } from '../utils/sentry.js';
import { logger } from '../utils/logger.js';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user info on mount
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      const parsedUser = JSON.parse(userInfo);
      setUser(parsedUser);
      // Set Sentry user context
      setSentryUser(parsedUser);
    }
    setLoading(false);
    
    // Listen for token refresh events
    const handleTokenRefresh = (event) => {
      if (event.detail) {
        setUser(event.detail);
        setSentryUser(event.detail);
      }
    };
    
    window.addEventListener('tokenRefreshed', handleTokenRefresh);
    
    return () => {
      window.removeEventListener('tokenRefreshed', handleTokenRefresh);
    };
  }, []);

  const login = (userData) => {
    const normalized = {
      ...userData,
      token: userData?.token || userData?.accessToken || null,
      refreshToken: userData?.refreshToken || null,
    };
    localStorage.setItem('userInfo', JSON.stringify(normalized));
    setUser(normalized);
    setSentryUser(normalized);
  };

  const logout = async () => {
    // Try to revoke refresh token on backend
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      try {
        const user = JSON.parse(userInfo);
        if (user.refreshToken) {
          try {
            await fetch(`${import.meta.env.VITE_API_URL || 'https://overglow-backend.vercel.app'}/api/auth/logout`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
              },
              body: JSON.stringify({ refreshToken: user.refreshToken })
            });
          } catch (err) {
            // Ignore logout errors, continue with local logout
            logger.error('Logout API error:', err);
          }
        }
      } catch (err) {
        // Ignore errors
      }
    }
    
    localStorage.removeItem('userInfo');
    setUser(null);
    // Clear Sentry user context
    clearSentryUser();
  };

  const updateUser = (updatedData) => {
    const updatedUser = { ...user, ...updatedData };
    localStorage.setItem('userInfo', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const value = {
    user,
    loading,
    isLoading: loading, // alias pour compatibilité avec les composants qui utilisent isLoading
    login,
    logout,
    updateUser,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
