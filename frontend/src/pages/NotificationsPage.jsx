import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  CalendarDays,
  Package,
  Star,
  MessageSquare,
  Banknote,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../config/axios';
import ScrollToTopButton from '../components/ScrollToTopButton';
import { logger } from '../utils/logger.js';

const PAGE_SIZE = 20;

const iconForType = (type = '') => {
  if (type.startsWith('booking') || type.includes('payment')) {
    return { Icon: CalendarDays, className: 'bg-blue-100 text-blue-600' };
  }
  if (type.startsWith('product')) {
    return { Icon: Package, className: 'bg-green-100 text-green-600' };
  }
  if (type.startsWith('review')) {
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

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const groupKeyForDate = (dateStr) => {
  const date = startOfDay(dateStr);
  const today = startOfDay(new Date());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  if (date.getTime() === today.getTime()) return 'Aujourd’hui';
  if (date.getTime() === yesterday.getTime()) return 'Hier';
  if (date >= weekAgo) return 'Cette semaine';
  return 'Plus ancien';
};

const GROUP_ORDER = ['Aujourd’hui', 'Hier', 'Cette semaine', 'Plus ancien'];

const getNotificationLink = (notification) => {
  if (!notification.relatedEntity?.id) return null;
  const { type, id } = notification.relatedEntity;
  const entityId = id?._id || id;
  switch (type) {
    case 'Product':
      return `/products/${entityId}`;
    case 'Booking':
      return '/dashboard';
    case 'Review':
      return '/dashboard';
    case 'Inquiry':
      return '/operator/inquiries';
    case 'Withdrawal':
      return '/operator/withdrawals';
    default:
      return null;
  }
};

const NotificationsPage = () => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);

  const fetchPage = useCallback(async (pageNum, replace = false) => {
    if (replace) setLoading(true);
    else setLoadingMore(true);
    try {
      const { data } = await api.get('/api/notifications', {
        params: {
          limit: PAGE_SIZE,
          page: pageNum,
          unreadOnly: filter === 'unread' ? 'true' : 'false',
        },
      });
      const list = data.notifications || [];
      setNotifications((prev) => (replace ? list : [...prev, ...list]));
      setUnreadCount(data.unreadCount || 0);
      setHasMore(Boolean(data.hasMore));
      setPage(pageNum);
    } catch (error) {
      logger.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filter]);

  useEffect(() => {
    // [PROMPT-3] Do NOT auto-mark all as read on load
    fetchPage(1, true);
  }, [fetchPage]);

  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/api/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notificationId ? { ...n, isRead: true, readAt: new Date() } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      window.dispatchEvent(new CustomEvent('notificationsRead'));
    } catch (error) {
      logger.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/api/notifications/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: new Date() })));
      setUnreadCount(0);
      window.dispatchEvent(new CustomEvent('notificationsRead'));
    } catch (error) {
      logger.error('Failed to mark all as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/api/notifications/${notificationId}`);
      setNotifications((prev) => {
        const notif = prev.find((n) => n._id === notificationId);
        if (notif && !notif.isRead) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        return prev.filter((n) => n._id !== notificationId);
      });
    } catch (error) {
      logger.error('Failed to delete notification:', error);
    }
  };

  const grouped = useMemo(() => {
    const map = {};
    for (const n of notifications) {
      const key = groupKeyForDate(n.createdAt);
      if (!map[key]) map[key] = [];
      map[key].push(n);
    }
    return GROUP_ORDER.filter((k) => map[k]?.length).map((k) => ({ label: k, items: map[k] }));
  }, [notifications]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-24 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-heading font-bold text-gray-900">
            {t('notifications.page_title', 'Notifications')}
          </h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllAsRead}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
          >
            <CheckCheck size={18} />
            Tout marquer comme lu
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            filter === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Toutes
        </button>
        <button
          type="button"
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            filter === 'unread' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Non lues ({unreadCount})
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-12 text-center border border-gray-100">
          <Bell size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Aucune notification</h2>
          <p className="text-gray-600">
            {filter === 'unread'
              ? 'Vous êtes à jour — rien de non lu.'
              : 'Les alertes de réservations et messages apparaîtront ici.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <section key={group.label}>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 px-1">
                {group.label}
              </h2>
              <div className="space-y-2">
                {group.items.map((notification) => {
                  const link = getNotificationLink(notification);
                  const { Icon, className } = iconForType(notification.type);
                  const card = (
                    <div
                      className={`group bg-white rounded-xl border p-4 transition ${
                        notification.isRead
                          ? 'border-gray-200'
                          : 'border-primary-300 bg-primary-50/40'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${className}`}>
                          <Icon size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3
                            className={`mb-1 ${
                              notification.isRead ? 'font-medium text-gray-700' : 'font-bold text-gray-900'
                            }`}
                          >
                            {notification.title}
                          </h3>
                          <p className="text-sm text-gray-600">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(notification.createdAt).toLocaleString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition">
                          {!notification.isRead && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                markAsRead(notification._id);
                              }}
                              className="p-2 text-primary-600 hover:bg-primary-100 rounded-lg"
                              title="Marquer comme lu"
                            >
                              <Check size={18} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              deleteNotification(notification._id);
                            }}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                            title="Supprimer"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );

                  return link ? (
                    <Link key={notification._id} to={link} onClick={() => !notification.isRead && markAsRead(notification._id)}>
                      {card}
                    </Link>
                  ) : (
                    <div key={notification._id}>{card}</div>
                  );
                })}
              </div>
            </section>
          ))}

          {hasMore && (
            <div className="text-center pt-2">
              <button
                type="button"
                disabled={loadingMore}
                onClick={() => fetchPage(page + 1, false)}
                className="px-5 py-2.5 rounded-lg border border-gray-300 font-semibold text-gray-800 hover:bg-white disabled:opacity-50"
              >
                {loadingMore ? 'Chargement…' : 'Charger plus'}
              </button>
            </div>
          )}
        </div>
      )}

      <ScrollToTopButton />
    </div>
  );
};

export default NotificationsPage;
