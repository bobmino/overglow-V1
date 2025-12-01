import React, { useState, useEffect } from 'react';
import api from '../config/axios';
import { Users, Mail, Shield, Trash2, AlertCircle } from 'lucide-react';
import ScrollToTopButton from '../components/ScrollToTopButton';
import DashboardNavBar from '../components/DashboardNavBar';

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/api/admin/users');
      setUsers(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${userName}" ?`)) {
      return;
    }

    try {
      await api.delete(`/api/admin/users/${userId}`);
      fetchUsers();
    } catch (error) {
      alert('Failed to delete user');
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      'Admin': { color: 'bg-purple-100 text-purple-800', icon: Shield },
      'Opérateur': { color: 'bg-blue-100 text-blue-800', icon: Users },
      'Client': { color: 'bg-gray-100 text-gray-800', icon: Users },
    };
    const badge = badges[role] || badges['Client'];
    const Icon = badge.icon;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge.color} flex items-center gap-1`}>
        <Icon size={12} />
        {role}
      </span>
    );
  };

  const filteredUsers = filter === 'all' 
    ? users 
    : users.filter(user => user.role === filter);

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
        <h1 className="text-3xl font-bold text-gray-900">Gestion des Utilisateurs</h1>
        <DashboardNavBar />
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            filter === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Tous ({users.length})
        </button>
        <button
          onClick={() => setFilter('Client')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            filter === 'Client' ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Clients ({users.filter(u => u.role === 'Client').length})
        </button>
        <button
          onClick={() => setFilter('Opérateur')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            filter === 'Opérateur' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Opérateurs ({users.filter(u => u.role === 'Opérateur').length})
        </button>
        <button
          onClick={() => setFilter('Admin')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            filter === 'Admin' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Admins ({users.filter(u => u.role === 'Admin').length})
        </button>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-12 text-center">
          <Users size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Aucun utilisateur</h2>
          <p className="text-gray-600">Aucun utilisateur trouvé avec ce filtre</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <div key={user._id} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Users size={24} className="text-primary-600" />
                    <h3 className="text-xl font-bold text-gray-900">{user.name}</h3>
                    {getRoleBadge(user.role)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail size={14} />
                    {user.email}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Inscrit le: {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                {user.role !== 'Admin' && (
                  <button
                    onClick={() => handleDeleteUser(user._id, user.name)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition flex items-center gap-2"
                  >
                    <Trash2 size={16} />
                    Supprimer
                  </button>
                )}
                {user.role === 'Admin' && (
                  <div className="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg font-semibold flex items-center gap-2">
                    <AlertCircle size={16} />
                    Protégé
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ScrollToTopButton />
    </div>
  );
};

export default AdminUsersPage;

