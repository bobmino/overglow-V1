import { useCallback, useEffect, useState } from 'react';
import api from '../config/axios';
import { useAuth } from '../context/AuthContext';

/**
 * [PROMPT-7] Poll unread notification count every 30s when authenticated.
 * @param {number} [intervalMs=30000]
 * @returns {{ unreadCount: number, setUnreadCount: Function, refetch: Function }}
 */
export const useNotificationPolling = (intervalMs = 30000) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refetch = useCallback(async () => {
    try {
      const { data } = await api.get('/api/notifications/unread-count');
      setUnreadCount(data.count ?? data.unreadCount ?? 0);
    } catch {
      /* silent — avoid toast spam on poll */
    }
  }, []);

  useEffect(() => {
    if (authLoading || !isAuthenticated) {
      setUnreadCount(0);
      return undefined;
    }

    refetch();
    const onRead = () => refetch();
    window.addEventListener('notificationsRead', onRead);
    const interval = setInterval(refetch, intervalMs);

    return () => {
      window.removeEventListener('notificationsRead', onRead);
      clearInterval(interval);
    };
  }, [authLoading, isAuthenticated, refetch, intervalMs]);

  return { unreadCount, setUnreadCount, refetch };
};

export default useNotificationPolling;
