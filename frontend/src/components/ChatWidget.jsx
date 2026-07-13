import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../config/axios';
import { MessageSquare, X, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { logger } from '../utils/logger.js';

const AI_ACK_KEY = 'overglow_ai_chat_ack_v1';

const ChatWidget = ({ inquiryId, chatId, onClose }) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [aiAck, setAiAck] = useState(() => {
    try {
      return localStorage.getItem(AI_ACK_KEY) === '1';
    } catch {
      return false;
    }
  });
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatId) {
      fetchChat();
    } else if (inquiryId) {
      fetchOrCreateChat();
    } else {
      fetchOrCreateSupportChat();
    }
  }, [chatId, inquiryId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (chat?._id) {
        fetchMessages();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [chat?._id]);

  const fetchOrCreateSupportChat = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/chat/support');
      setChat(data.chat);
      setMessages(data.messages || []);
    } catch (err) {
      logger.error('Failed to fetch support chat:', err);
      setError(t('chat.load_error_support'));
    } finally {
      setLoading(false);
    }
  };

  const fetchOrCreateChat = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/api/chat/inquiry/${inquiryId}`);
      setChat(data.chat);
      setMessages(data.messages || []);
    } catch (err) {
      logger.error('Failed to fetch or create chat:', err);
      setError(t('chat.load_error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchChat = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/api/chat/${chatId}`);
      setChat(data.chat);
      setMessages(data.messages || []);
    } catch (err) {
      logger.error('Failed to fetch chat:', err);
      setError(t('chat.load_error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data } = await api.get(`/api/chat/${chat._id}`);
      setMessages(data.messages || []);
    } catch (err) {
      logger.error('Failed to fetch messages:', err);
    }
  };

  const handleAckAi = (checked) => {
    setAiAck(checked);
    try {
      if (checked) localStorage.setItem(AI_ACK_KEY, '1');
      else localStorage.removeItem(AI_ACK_KEY);
    } catch {
      // ignore
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !aiAck) return;

    try {
      setSending(true);
      const { data } = await api.post(`/api/chat/${chat._id}/messages`, {
        content: newMessage.trim(),
        type: 'text',
      });

      // API returns { userMessage, aiMessage } or legacy single message
      const next = [];
      if (data?.userMessage) next.push(data.userMessage);
      else if (data?._id) next.push(data);
      if (data?.aiMessage) next.push(data.aiMessage);

      setMessages((prev) => [...prev, ...next]);
      setNewMessage('');
      setError('');
    } catch (err) {
      logger.error('Failed to send message:', err);
      setError(t('chat.send_error'));
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getOtherParticipant = () => {
    if (!chat?.participants) return null;
    return chat.participants.find((p) => p._id !== user?._id);
  };

  const formatTime = (date) => {
    const locale = (i18n.language || 'fr').slice(0, 2);
    return new Date(date).toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="fixed bottom-4 end-4 w-96 h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error && !chat) {
    return (
      <div className="fixed bottom-4 end-4 w-96 h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">{t('chat.title')}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label={t('chat.close')}
          >
            <X size={20} />
          </button>
        </div>
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  const otherParticipant = getOtherParticipant();

  return (
    <div className="fixed bottom-4 end-4 w-96 h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-primary-600 text-white rounded-t-lg">
        <div className="flex items-center gap-2">
          <MessageSquare size={20} />
          <div>
            <h3 className="font-bold">{otherParticipant?.name || t('chat.title')}</h3>
            {otherParticipant?.role && (
              <p className="text-xs text-primary-100">{otherParticipant.role}</p>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-200 transition"
          aria-label={t('chat.close')}
        >
          <X size={20} />
        </button>
      </div>

      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
      >
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>{t('chat.empty')}</p>
            <p className="text-sm mt-2">{t('chat.empty_hint')}</p>
          </div>
        ) : (
          messages.map((message) => {
            const isAi = Boolean(message.isAI);
            const senderId = message.sender?._id || message.sender;
            const isOwnMessage = !isAi && String(senderId) === String(user?._id);

            return (
              <div
                key={message._id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    isAi
                      ? 'bg-slate-100 text-slate-800 border border-slate-300 border-dashed'
                      : isOwnMessage
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-gray-900 border border-gray-200'
                  }`}
                >
                  {isAi && (
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-slate-700 text-white">
                        {t('chat.ai_badge')}
                      </span>
                    </div>
                  )}
                  {!isOwnMessage && !isAi && (
                    <p className="text-xs font-semibold mb-1 opacity-75">
                      {message.sender?.name}
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  {isAi && (
                    <p className="text-[11px] mt-2 text-slate-500 leading-snug">
                      {t('chat.ai_disclaimer')}
                    </p>
                  )}
                  <p
                    className={`text-xs mt-1 ${
                      isOwnMessage ? 'text-primary-100' : 'text-gray-500'
                    }`}
                  >
                    {formatTime(message.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white rounded-b-lg space-y-3">
        {error && <div className="text-sm text-red-600">{error}</div>}

        <label className="flex items-start gap-2 text-xs text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={aiAck}
            onChange={(e) => handleAckAi(e.target.checked)}
          />
          <span>{t('chat.ai_ack')}</span>
        </label>

        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={t('chat.placeholder')}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            disabled={sending || !aiAck}
            aria-label={t('chat.placeholder')}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending || !aiAck}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            aria-label={t('chat.send')}
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWidget;
