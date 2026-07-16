import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../config/axios';
import { Users, Shield } from 'lucide-react';
import ScrollToTopButton from '../components/ScrollToTopButton';
import AdvancedFilters from '../components/AdvancedFilters';
import DataTable from '../components/DataTable';
import EmptyState from '../components/EmptyState';
import { logger } from '../utils/logger.js';
import { useToast } from '../context/ToastContext';
import { askConfirm } from '../utils/notify.js';

const getDateLocale = (language) => {
  const locale = language?.slice(0, 2) || 'fr';
  if (locale === 'ar') return 'ar-MA';
  if (locale === 'es') return 'es-ES';
  if (locale === 'en') return 'en-GB';
  return 'fr-FR';
};

const AdminUsersPage = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const dateLocale = getDateLocale(i18n.language);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/api/admin/users');
      setUsers(Array.isArray(data) ? data : data?.users || []);
      setLoading(false);
    } catch (error) {
      logger.error('Failed to fetch users:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = async (userId, userName) => {
    const ok = await askConfirm(t('admin.users.confirm_delete', { name: userName }));
    if (!ok) return;

    try {
      await api.delete(`/api/admin/users/${userId}`);
      toast.success(t('admin.users.delete_success', 'Utilisateur supprimé'));
      fetchUsers();
    } catch (_error) {
      toast.error(t('admin.users.delete_error'));
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      Admin: { color: 'bg-purple-100 text-purple-800', icon: Shield },
      'Opérateur': { color: 'bg-blue-100 text-blue-800', icon: Users },
      Client: { color: 'bg-gray-100 text-gray-800', icon: Users },
    };
    const badge = badges[role] || badges.Client;
    const Icon = badge.icon;
    const roleLabel = t(`admin.users.roles.${role}`, { defaultValue: role });
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge.color} flex items-center gap-1`}>
        <Icon size={12} />
        {roleLabel}
      </span>
    );
  };

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((user) => {
      if (filter !== 'all' && user.role !== filter) return false;
      if (!term) return true;
      return (
        user.name?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term)
      );
    });
  }, [users, filter, search]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-32 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{t('admin.users.title')}</h1>
      </div>

      <AdvancedFilters
        persistUrl={false}
        values={{ role: filter === 'all' ? '' : filter, search }}
        onChange={(_m, patch) => {
          if ('role' in patch) setFilter(patch.role || 'all');
          if ('search' in patch) setSearch(patch.search || '');
        }}
        filters={[
          {
            key: 'search',
            type: 'text',
            label: t('admin.common.search', 'Recherche'),
            placeholder: t('admin.users.search_placeholder', 'Nom ou email…'),
          },
          {
            key: 'role',
            type: 'select',
            label: 'Rôle',
            placeholder: t('admin.users.filter_all', { count: users.length }),
            options: [
              { value: 'Client', label: t('admin.users.filter_clients', { count: users.filter((u) => u.role === 'Client').length }) },
              { value: 'Opérateur', label: t('admin.users.filter_operators', { count: users.filter((u) => u.role === 'Opérateur').length }) },
              { value: 'Admin', label: t('admin.users.filter_admins', { count: users.filter((u) => u.role === 'Admin').length }) },
            ],
          },
        ]}
      />

      <DataTable
        loading={false}
        data={filteredUsers}
        emptyState={(
          <EmptyState
            variant="search"
            title={t('admin.users.empty_title')}
            subtitle={t('admin.users.empty_desc')}
          />
        )}
        columns={[
          {
            key: 'name',
            label: 'Nom',
            render: (user) => (
              <div className="flex items-center gap-2">
                <span className="font-semibold">{user.name}</span>
                {getRoleBadge(user.role)}
              </div>
            ),
          },
          { key: 'email', label: 'Email', render: (user) => user.email },
          {
            key: 'createdAt',
            label: 'Inscrit le',
            render: (user) => new Date(user.createdAt).toLocaleDateString(dateLocale),
          },
          {
            key: 'actions',
            label: 'Actions',
            render: (user) =>
              user.role === 'Admin' ? (
                <span className="text-xs text-gray-500">{t('admin.users.protected')}</span>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteUser(user._id, user.name);
                  }}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold"
                >
                  {t('admin.common.delete')}
                </button>
              ),
          },
        ]}
        renderMobileCard={(user) => (
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-gray-900">{user.name}</h3>
              {getRoleBadge(user.role)}
            </div>
            <p className="text-sm text-gray-600 break-all">{user.email}</p>
            {user.role !== 'Admin' && (
              <button
                type="button"
                onClick={() => handleDeleteUser(user._id, user.name)}
                className="min-h-11 w-full px-4 py-2 bg-red-600 text-white rounded-lg font-semibold"
              >
                {t('admin.common.delete')}
              </button>
            )}
          </div>
        )}
      />

      <ScrollToTopButton />
    </div>
  );
};

export default AdminUsersPage;

