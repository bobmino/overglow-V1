import React, { useState, useEffect } from 'react';
import api from '../config/axios';
import { Bell, Check, CheckCheck, Trash2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import ScrollToTopButton from '../components/ScrollToTopButton';
import DashboardNavBar from '../components/DashboardNavBar';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      const url = filter === 'unread' 
        ? '/api/notifications?unreadOnly=true'
        : '/api/notifications';
      const { data } = await api.get(url);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/api/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(n => n._id === notificationId ? { ...n, isRead: true, readAt: new Date() } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/api/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: new Date() })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/api/notifications/${notificationId}`);
      setNotifications(prev => {
        const notif = prev.find(n => n._id === notificationId);
        if (notif && !notif.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        return prev.filter(n => n._id !== notificationId);
      });
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const getNotificationLink = (notification) => {
    if (!notification.relatedEntity || !notification.relatedEntity.id) {
      return null;
    }

    const { type, id } = notification.relatedEntity;
    
    switch (type) {
      case 'Product':
        return `/products/${id}`;
      case 'Booking':
        return `/dashboard`;
      case 'Review':
        return `/dashboard`;
      case 'Inquiry':
        return notification.user?.role === 'Opérateur' ? '/operator/inquiries' : '/my-inquiries';
      case 'Withdrawal':
        return notification.user?.role === 'Opérateur' ? '/operator/withdrawals' : '/dashboard';
      default:
        return null;
    }
  };

  const getNotificationIcon = (type) => {
    const iconClass = "w-10 h-10 rounded-full flex items-center justify-center";
    switch (type) {
      case 'booking_created':
      case 'booking_confirmed':
        return <div className={`${iconClass} bg-blue-100 text-blue-600`}>📅</div>;
      case 'product_pending':
      case 'product_approved':
        return <div className={`${iconClass} bg-green-100 text-green-600`}>📦</div>;
      case 'review_pending':
      case 'review_approved':
        return <div className={`${iconClass} bg-yellow-100 text-yellow-600`}>⭐</div>;
      case 'inquiry_received':
      case 'inquiry_answered':
        return <div className={`${iconClass} bg-purple-100 text-purple-600`}>💬</div>;
      case 'withdrawal_requested':
      case 'withdrawal_approved':
        return <div className={`${iconClass} bg-emerald-100 text-emerald-600`}>💰</div>;
      default:
        return <div className={`${iconClass} bg-gray-100 text-gray-600`}><Bell size={20} /></div>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-24 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              {unreadCount} notification{unreadCount > 1 ? 's' : ''} non lue{unreadCount > 1 ? 's' : ''}
            </p>
          )}
        </div>
        <DashboardNavBar />
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            filter === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Toutes
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            filter === 'unread' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Non lues ({unreadCount})
        </button>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="ml-auto px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition flex items-center gap-2"
          >
            <CheckCheck size={18} />
            Tout marquer comme lu
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-12 text-center">
          <Bell size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Aucune notification</h2>
          <p className="text-gray-600">
            {filter === 'unread' 
              ? 'Vous n\'avez pas de notifications non lues'
              : 'Vous n\'avez pas encore de notifications'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const link = getNotificationLink(notification);
            const NotificationContent = (
              <div
                className={`bg-white rounded-xl border p-4 transition ${
                  notification.isRead 
                    ? 'border-gray-200' 
                    : 'border-primary-300 bg-primary-50'
                }`}
              >
                <div className="flex items-start gap-4">
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className={`font-bold mb-1 ${notification.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                          {notification.title}
                        </h3>
                        <p className={`text-sm ${notification.isRead ? 'text-gray-600' : 'text-gray-800'}`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(notification.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {!notification.isRead && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification._id);
                            }}
                            className="p-2 text-primary-600 hover:bg-primary-100 rounded-lg transition"
                            title="Marquer comme lu"
                          >
                            <Check size={18} />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification._id);
                          }}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                          title="Supprimer"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );

            return link ? (
              <Link key={notification._id} to={link}>
                {NotificationContent}
              </Link>
            ) : (
              <div key={notification._id}>
                {NotificationContent}
              </div>
            );
          })}
        </div>
      )}

      <ScrollToTopButton />
    </div>
  );
};

export default NotificationsPage;

