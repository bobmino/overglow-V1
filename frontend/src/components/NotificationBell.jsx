import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import {
  Bell,
  Check,
  CheckCheck,
  CalendarDays,
  Package,
  Star,
  MessageSquare,
  Banknote,
} from 'lucide-react';
import api from '../config/axios';
import { useAuth } from '../context/AuthContext';
import { useNotificationPolling } from '../hooks/useNotificationPolling';
import { logger } from '../utils/logger.js';

const iconForType = (type = '') => {
  if (type.startsWith('booking') || type.includes('payment')) {
    return { Icon: CalendarDays, className: 'bg-blue-100 text-blue-600' };
  }
  if (type.startsWith('product')) {
    return { Icon: Package, className: 'bg-green-100 text-green-600' };
  }
  if (type.startsWith('review') || type === 'new_review' || type === 'low_rating') {
    return { Icon: Star, className: 'bg-yellow-100 text-yellow-700' };
  }
  if (type.startsWith('inquiry')) {
    return { Icon: MessageSquare, className: 'bg-purple-100 text-purple-600' };
  }
  if (type.startsWith('withdrawal') || type.includes('refund')) {
    return { Icon: Banknote, className: 'bg-emerald-100 text-emerald-700' };
  }
  return { Icon: Bell, className: 'bg-gray-100 text-gray-600' };
};

const relativeTimeFr = (dateStr) => {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'à l’instant';
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'hier';
  if (days < 7) return `il y a ${days} j`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

const linkForNotification = (n) => {
  const type = n.relatedEntity?.type;
  const id = n.relatedEntity?.id?._id || n.relatedEntity?.id;
  if (!type) return '/notifications';
  switch (type) {
    case 'Product':
      return id ? `/products/${id}` : '/notifications';
    case 'Booking':
      return '/dashboard';
    case 'Inquiry':
      return '/operator/inquiries';
    case 'Withdrawal':
      return '/operator/withdrawals';
    case 'Review':
      return '/operator/dashboard';
    default:
      return '/notifications';
  }
};

/**
 * [PROMPT-3 + PROMPT-7] Header notification bell with dropdown + polling.
 */
const NotificationBell = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const { unreadCount, setUnreadCount, refetch } = useNotificationPolling(30000);

  const fetchUnreadPreview = useCallback(async () => {
    setLoadingList(true);
    try {
      const { data } = await api.get('/api/notifications', {
        params: { unreadOnly: true, limit: 5 },
      });
      setItems(data.notifications || []);
      if (typeof data.unreadCount === 'number') {
        setUnreadCount(data.unreadCount);
      }
    } catch (err) {
      logger.error('Notification preview failed', err);
    } finally {
      setLoadingList(false);
    }
  }, [setUnreadCount]);

  useEffect(() => {
    if (!open) return undefined;
    fetchUnreadPreview();
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open, fetchUnreadPreview]);

  const markAllRead = async () => {
    try {
      await api.post('/api/notifications/mark-all-read');
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      window.dispatchEvent(new CustomEvent('notificationsRead'));
    } catch (err) {
      logger.error('mark all read failed', err);
    }
  };

  const openItem = async (n) => {
    try {
      if (!n.isRead) {
        await api.put(`/api/notifications/${n._id}/read`);
        setUnreadCount((c) => Math.max(0, c - 1));
        window.dispatchEvent(new CustomEvent('notificationsRead'));
      }
    } catch {
      /* ignore */
    }
    setOpen(false);
    navigate(linkForNotification(n));
  };

  if (authLoading || !isAuthenticated) return null;

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          refetch();
        }}
        className="relative p-2 text-slate-600 hover:text-primary-600 hover:bg-slate-100 rounded-lg transition"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 end-0 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[1.25rem] h-5 px-1 flex items-center justify-center transform translate-x-0.5 -translate-y-0.5">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <Motion.div
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute end-0 mt-2 w-[360px] max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h3 className="font-heading font-bold text-slate-900">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-xs font-semibold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
                >
                  <CheckCheck size={14} />
                  Tout marquer comme lu
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {loadingList ? (
                <div className="p-4 space-y-3 animate-pulse">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-14 bg-slate-100 rounded-lg" />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="py-10 px-4 text-center text-slate-500">
                  <Check size={32} className="mx-auto text-green-500 mb-2" />
                  <p className="text-sm font-medium">Aucune nouvelle notification</p>
                </div>
              ) : (
                <ul>
                  {items.map((n) => {
                    const { Icon, className } = iconForType(n.type);
                    return (
                      <li key={n._id}>
                        <button
                          type="button"
                          onClick={() => openItem(n)}
                          className="w-full text-start px-4 py-3 flex gap-3 hover:bg-slate-50 border-b border-slate-50"
                        >
                          <span className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${className}`}>
                            <Icon size={16} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className={`block text-sm truncate ${n.isRead ? 'font-medium text-slate-700' : 'font-bold text-slate-900'}`}>
                              {n.title}
                            </span>
                            <span className="block text-xs text-slate-500 mt-0.5">
                              {relativeTimeFr(n.createdAt)}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="border-t border-slate-100 px-4 py-2.5 bg-slate-50">
              <Link
                to="/notifications"
                onClick={() => setOpen(false)}
                className="block text-center text-sm font-semibold text-primary-700 hover:text-primary-800"
              >
                Voir toutes les notifications
              </Link>
            </div>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
