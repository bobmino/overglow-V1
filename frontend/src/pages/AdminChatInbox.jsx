import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, MessageSquare, Search } from 'lucide-react';
import ChatWidget from '../components/ChatWidget';
import EmptyState from '../components/EmptyState';
import api from '../config/axios';
import { useAuth } from '../context/AuthContext';
import { logger } from '../utils/logger.js';

const AdminChatInbox = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const fetchConversations = async () => {
      try {
        setLoading(true);
        setError('');
        const { data } = await api.get('/api/chat');
        const items = Array.isArray(data) ? data : data.conversations || data.chats || [];

        if (!cancelled) {
          setConversations(items);
        }
      } catch (err) {
        logger.error('Failed to fetch admin chat conversations:', err);
        if (!cancelled) {
          setError('Impossible de charger les conversations.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchConversations();
    return () => {
      cancelled = true;
    };
  }, []);

  const getOtherParticipant = useCallback(
    (conversation) => {
      const participants = conversation?.participants || [];
      return (
        participants.find(
          (participant) => String(participant?._id) !== String(user?._id)
        ) ||
        participants[0] ||
        null
      );
    },
    [user?._id]
  );

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('fr');
    if (!query) return conversations;

    return conversations.filter((conversation) => {
      const participant = getOtherParticipant(conversation);
      return `${participant?.name || ''} ${participant?.email || ''}`
        .toLocaleLowerCase('fr')
        .includes(query);
    });
  }, [conversations, getOtherParticipant, search]);

  const selectedConversation = conversations.find(
    (conversation) => String(conversation._id) === String(selectedChatId)
  );
  const selectedParticipant = getOtherParticipant(selectedConversation);
  const showChatPane = Boolean(selectedConversation);

  const formatRelativeTime = (date) => {
    if (!date) return '';

    const timestamp = new Date(date).getTime();
    if (Number.isNaN(timestamp)) return '';

    const elapsedSeconds = Math.round((timestamp - Date.now()) / 1000);
    const formatter = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' });
    const ranges = [
      { limit: 60, divisor: 1, unit: 'second' },
      { limit: 3600, divisor: 60, unit: 'minute' },
      { limit: 86400, divisor: 3600, unit: 'hour' },
      { limit: 604800, divisor: 86400, unit: 'day' },
      { limit: 2629800, divisor: 604800, unit: 'week' },
      { limit: 31557600, divisor: 2629800, unit: 'month' },
      { limit: Infinity, divisor: 31557600, unit: 'year' },
    ];
    const range = ranges.find(
      ({ limit }) => Math.abs(elapsedSeconds) < limit
    );

    return formatter.format(
      Math.round(elapsedSeconds / range.divisor),
      range.unit
    );
  };

  const getLastMessagePreview = (conversation) => {
    const lastMessage = conversation.lastMessage;
    if (!lastMessage) return 'Aucun message';
    if (lastMessage.type === 'image') return 'Image';
    if (lastMessage.type === 'file') return 'Pièce jointe';
    return lastMessage.content || 'Aucun message';
  };

  return (
    <main className="flex h-[calc(100dvh-7rem)] min-h-[480px] md:h-[calc(100vh-3.5rem)] md:min-h-[600px] overflow-hidden bg-gray-100">
      <aside
        className={`flex w-full shrink-0 flex-col border-r border-gray-200 bg-white md:w-[300px] ${
          showChatPane ? 'hidden md:flex' : 'flex'
        }`}
      >
        <div className="border-b border-gray-200 p-4">
          <div className="mb-4 flex items-center gap-2">
            <MessageSquare className="text-primary-600" size={22} />
            <h1 className="text-lg font-bold text-gray-900">Conversations</h1>
          </div>
          <div className="relative">
            <Search
              size={17}
              className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pe-3 ps-9 text-sm min-h-11 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              aria-label="Rechercher une conversation"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="space-y-3 p-4" aria-label="Chargement des conversations">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="flex animate-pulse gap-3">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-2/3 rounded bg-gray-200" />
                    <div className="h-3 rounded bg-gray-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-6 text-center text-sm text-red-600">{error}</div>
          ) : filteredConversations.length === 0 ? (
            <EmptyState
              variant="messages"
              title={
                search
                  ? 'Aucune conversation ne correspond à votre recherche.'
                  : 'Aucune conversation pour le moment.'
              }
              className="py-6"
            />
          ) : (
            filteredConversations.map((conversation) => {
              const participant = getOtherParticipant(conversation);
              const participantName = participant?.name || 'Utilisateur';
              const isSelected =
                String(selectedChatId) === String(conversation._id);
              const unreadCount = Number(conversation.unreadForMe || 0);

              return (
                <button
                  type="button"
                  key={conversation._id}
                  onClick={() => setSelectedChatId(conversation._id)}
                  className={`flex w-full items-start gap-3 border-b border-gray-100 p-4 text-start transition min-h-11 ${
                    isSelected
                      ? 'bg-primary-50'
                      : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 font-bold uppercase text-primary-700">
                    {participantName.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {participantName}
                      </p>
                      <span className="shrink-0 text-[10px] text-gray-400">
                        {formatRelativeTime(
                          conversation.lastMessageAt ||
                            conversation.lastMessage?.createdAt
                        )}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <p className="min-w-0 flex-1 truncate text-xs text-gray-500">
                        {getLastMessagePreview(conversation)}
                      </p>
                      {unreadCount > 0 && (
                        <span className="flex min-w-5 shrink-0 items-center justify-center rounded-full bg-primary-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      <section
        className={`min-w-0 flex-1 flex-col ${
          showChatPane ? 'flex' : 'hidden md:flex'
        }`}
      >
        {selectedConversation ? (
          <>
            <header className="flex min-h-14 items-center justify-between gap-2 border-b border-gray-200 bg-white px-3 py-3 md:min-h-16 md:px-6">
              <div className="flex min-w-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedChatId(null)}
                  className="md:hidden inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100"
                  aria-label="Retour aux conversations"
                >
                  <ChevronLeft size={22} />
                </button>
                <div className="min-w-0">
                  <h2 className="truncate font-bold text-gray-900">
                    {selectedParticipant?.name || 'Utilisateur'}
                  </h2>
                  <p className="truncate text-sm text-gray-500">
                    {selectedParticipant?.email || 'Adresse e-mail indisponible'}
                  </p>
                </div>
              </div>
              <Link
                to="/admin/users"
                className="hidden sm:inline shrink-0 text-sm font-semibold text-primary-600 hover:text-primary-700 hover:underline"
              >
                Voir les utilisateurs
              </Link>
            </header>
            <div className="min-h-0 flex-1">
              <ChatWidget
                key={selectedChatId}
                chatId={selectedChatId}
                embedded
                onClose={() => setSelectedChatId(null)}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-gray-500">
            <div className="mb-4 rounded-full bg-white p-5 shadow-sm">
              <MessageSquare size={36} className="text-primary-500" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">
              Sélectionnez une conversation
            </h2>
            <p className="mt-1 max-w-sm text-sm">
              Choisissez une conversation dans la liste pour consulter les
              messages et répondre.
            </p>
          </div>
        )}
      </section>
    </main>
  );
};

export default AdminChatInbox;
