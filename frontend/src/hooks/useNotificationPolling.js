import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../config/axios';
import { useAuth } from '../context/AuthContext';

/**
 * [PROMPT-7] Poll unread notification count when authenticated.
 * Pauses when tab is hidden; stops after auth failure to avoid 401/429 storms.
 * @param {number} [intervalMs=30000]
 */
export const useNotificationPolling = (intervalMs = 30000) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const stoppedRef = useRef(false);

  const refetch = useCallback(async () => {
    if (stoppedRef.current || (typeof document !== 'undefined' && document.hidden)) {
      return;
    }
    try {
      const { data } = await api.get('/api/notifications/unread-count');
      setUnreadCount(data.count ?? data.unreadCount ?? 0);
      stoppedRef.current = false;
    } catch (err) {
      const status = err.response?.status;
      if (status === 401 || status === 403) {
        stoppedRef.current = true;
        setUnreadCount(0);
      }
    }
  }, []);

  useEffect(() => {
    if (authLoading || !isAuthenticated) {
      setUnreadCount(0);
      stoppedRef.current = false;
      return undefined;
    }

    stoppedRef.current = false;
    refetch();

    const onRead = () => refetch();
    const onVisibility = () => {
      if (!document.hidden) refetch();
    };

    window.addEventListener('notificationsRead', onRead);
    document.addEventListener('visibilitychange', onVisibility);
    const interval = setInterval(refetch, intervalMs);

    return () => {
      window.removeEventListener('notificationsRead', onRead);
      document.removeEventListener('visibilitychange', onVisibility);
      clearInterval(interval);
    };
  }, [authLoading, isAuthenticated, refetch, intervalMs]);

  return { unreadCount, setUnreadCount, refetch };
};

export default useNotificationPolling;
