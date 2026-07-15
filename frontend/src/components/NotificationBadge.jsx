import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import api from '../config/axios';
import { useAuth } from '../context/AuthContext';
import { logger } from '../utils/logger.js';

const NotificationBadge = () => {
  // FIX 401 : on attend que l'état d'auth soit stabilisé avant d'appeler l'API.
  // Sans ce garde, le composant appelle /api/notifications/unread-count AVANT que
  // le token soit injecté, ce qui génère un 401 au montage sur CheckoutPage.
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if browser supports notifications
    if ('Notification' in window && 'serviceWorker' in navigator) {
      setIsSupported(true);
    }
  }, []);

  useEffect(() => {
    // FIX 401 : Ne pas appeler l'API tant que l'auth est en cours de chargement
    // ou que l'utilisateur n'est pas authentifié.
    if (authLoading || !isAuthenticated) return;

    const fetchUnreadCount = async () => {
      try {
        const { data } = await api.get('/api/notifications/unread-count');
        setUnreadCount(data.unreadCount || 0);
      } catch (_error) {
        // Silently fail
      }
    };

    fetchUnreadCount();
    
    const handleNotificationsRead = () => {
      setUnreadCount(0);
    };
    
    window.addEventListener('notificationsRead', handleNotificationsRead);
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => {
      window.removeEventListener('notificationsRead', handleNotificationsRead);
      clearInterval(interval);
    };
  }, [isAuthenticated, authLoading]);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('Votre navigateur ne supporte pas les notifications');
      return;
    }

    if (Notification.permission === 'granted') {
      return;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        // Register service worker for push notifications
        if ('serviceWorker' in navigator) {
          try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            if (import.meta.env.DEV) {
              logger.info('Service Worker registered:', registration);
            }
          } catch (error) {
            logger.error('Service Worker registration failed:', error);
          }
        }
      }
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="relative">
      <Link
        to="/notifications"
        className="relative p-2 text-slate-600 hover:text-primary-600 hover:bg-slate-100 rounded-lg transition"
        onClick={isSupported ? requestNotificationPermission : undefined}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 end-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center transform translate-x-1 -translate-y-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Link>
    </div>
  );
};

export default NotificationBadge;

