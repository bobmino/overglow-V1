import React, { useState, useEffect, useRef } from 'react';
import api from '../config/axios';
import { MessageSquare, X, Send, Paperclip, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ChatWidget = ({ inquiryId, chatId, onClose }) => {
  const { user } = useAuth();
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatId) {
      fetchChat();
    } else if (inquiryId) {
      fetchOrCreateChat();
    }
  }, [chatId, inquiryId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Poll for new messages every 5 seconds
    const interval = setInterval(() => {
      if (chat?._id) {
        fetchMessages();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [chat?._id]);

  const fetchOrCreateChat = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/api/chat/inquiry/${inquiryId}`);
      setChat(data.chat);
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Failed to fetch or create chat:', error);
      setError('Erreur lors du chargement du chat');
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
    } catch (error) {
      console.error('Failed to fetch chat:', error);
      setError('Erreur lors du chargement du chat');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data } = await api.get(`/api/chat/${chat._id}`);
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      const { data } = await api.post(`/api/chat/${chat._id}/messages`, {
        content: newMessage.trim(),
        type: 'text',
      });

      setMessages((prev) => [...prev, data]);
      setNewMessage('');
      setError('');
    } catch (error) {
      console.error('Failed to send message:', error);
      setError('Erreur lors de l\'envoi du message');
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
    return new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error && !chat) {
    return (
      <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Chat</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Fermer"
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
    <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-primary-600 text-white rounded-t-lg">
        <div className="flex items-center gap-2">
          <MessageSquare size={20} />
          <div>
            <h3 className="font-bold">
              {otherParticipant?.name || 'Chat'}
            </h3>
            {otherParticipant?.role && (
              <p className="text-xs text-primary-100">{otherParticipant.role}</p>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-200 transition"
          aria-label="Fermer"
        >
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
      >
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>Aucun message pour le moment</p>
            <p className="text-sm mt-2">Commencez la conversation !</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.sender._id === user?._id;
            return (
              <div
                key={message._id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    isOwnMessage
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}
                >
                  {!isOwnMessage && (
                    <p className="text-xs font-semibold mb-1 opacity-75">
                      {message.sender.name}
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
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

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
        {error && (
          <div className="mb-2 text-sm text-red-600">{error}</div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Tapez votre message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            disabled={sending}
            aria-label="Message"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            aria-label="Envoyer"
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWidget;

