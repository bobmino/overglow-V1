import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Check,
  CheckCheck,
  Image as LucideImage,
  MessageSquare,
  Paperclip,
  Send,
  X,
} from 'lucide-react';
import api from '../config/axios';
import { useAuth } from '../context/AuthContext';
import { logger } from '../utils/logger.js';

const AI_ACK_KEY = 'overglow_ai_chat_ack_v1';

const ChatWidget = ({ inquiryId, chatId, onClose, embedded = false }) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [typingUserIds, setTypingUserIds] = useState([]);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
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
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const loadChat = async () => {
      try {
        setLoading(true);
        setError('');

        let response;
        if (chatId) {
          response = await api.get(`/api/chat/${chatId}`);
        } else if (inquiryId) {
          response = await api.get(`/api/chat/inquiry/${inquiryId}`);
        } else {
          response = await api.get('/api/chat/support');
        }

        if (!cancelled) {
          setChat(response.data.chat);
          setMessages(response.data.messages || []);
        }
      } catch (err) {
        logger.error('Failed to load chat:', err);
        if (!cancelled) {
          setChat(null);
          setError(
            inquiryId || chatId
              ? t('chat.load_error')
              : t('chat.load_error_support')
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadChat();
    return () => {
      cancelled = true;
    };
  }, [chatId, inquiryId, t]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUserIds]);

  useEffect(() => {
    if (!chat?._id) return undefined;

    const fetchMessages = async () => {
      try {
        const { data } = await api.get(`/api/chat/${chat._id}`);
        setMessages(data.messages || []);
      } catch (err) {
        logger.error('Failed to fetch messages:', err);
      }
    };

    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [chat?._id]);

  useEffect(() => {
    if (!chat?._id) {
      setTypingUserIds([]);
      return undefined;
    }

    const fetchTyping = async () => {
      try {
        const { data } = await api.get(`/api/chat/${chat._id}/typing`);
        setTypingUserIds(data.typingUserIds || []);
      } catch (err) {
        logger.error('Failed to fetch typing status:', err);
      }
    };

    fetchTyping();
    const interval = setInterval(fetchTyping, 2000);
    return () => clearInterval(interval);
  }, [chat?._id]);

  useEffect(
    () => () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    },
    []
  );

  const appendApiMessages = (data) => {
    const nextMessages = [];
    if (data?.userMessage) nextMessages.push(data.userMessage);
    else if (data?._id) nextMessages.push(data);
    if (data?.aiMessage) nextMessages.push(data.aiMessage);

    if (nextMessages.length) {
      setMessages((current) => [...current, ...nextMessages]);
    }
  };

  const handleAckAi = (checked) => {
    setAiAck(checked);
    try {
      if (checked) localStorage.setItem(AI_ACK_KEY, '1');
      else localStorage.removeItem(AI_ACK_KEY);
    } catch {
      // Le stockage local peut être indisponible en navigation privée.
    }
  };

  const notifyTyping = () => {
    if (!chat?._id) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(async () => {
      try {
        await api.post(`/api/chat/${chat._id}/typing`);
      } catch (err) {
        logger.error('Failed to send typing status:', err);
      }
    }, 400);
  };

  const handleMessageChange = (event) => {
    setNewMessage(event.target.value);
    notifyTyping();
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    if (!newMessage.trim() || sending || !aiAck || !chat?._id) return;

    try {
      setSending(true);
      const content = newMessage.trim();
      setNewMessage('');
      const { data } = await api.post(`/api/chat/${chat._id}/messages`, {
        content,
        type: 'text',
      });
      appendApiMessages(data);
      setError('');
    } catch (err) {
      logger.error('Failed to send message:', err);
      setError(t('chat.send_error'));
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = async (event, type) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !chat?._id || uploading || !aiAck) return;

    try {
      setUploading(true);
      setError('');
      const formData = new FormData();
      formData.append('image', file);

      const { data: uploadData } = await api.post('/api/upload/chat', formData);
      const url = uploadData.url;
      const filename = uploadData.filename || file.name;
      const { data: messageData } = await api.post(
        `/api/chat/${chat._id}/messages`,
        {
          content: filename,
          type,
          attachments: [{ url, type, name: filename }],
        }
      );
      appendApiMessages(messageData);
    } catch (err) {
      logger.error('Failed to upload chat attachment:', err);
      setError("Impossible d'envoyer la pièce jointe.");
    } finally {
      setUploading(false);
    }
  };

  const getOtherParticipant = () => {
    if (!chat?.participants) return null;
    return (
      chat.participants.find(
        (participant) => String(participant._id) !== String(user?._id)
      ) || chat.participants[0]
    );
  };

  const formatTime = (date) => {
    const locale = (i18n.language || 'fr').slice(0, 2);
    return new Date(date).toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const containerClassName = embedded
    ? 'h-full w-full rounded-none shadow-none border-0 bg-white flex flex-col'
    : 'fixed bottom-4 end-4 w-96 h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col';

  if (loading) {
    return (
      <div className={`${containerClassName} items-center justify-center`}>
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error && !chat) {
    return (
      <div className={`${containerClassName} p-6`}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">{t('chat.title')}</h3>
          <button
            type="button"
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
    <>
      <div className={containerClassName}>
        <div
          className={`flex items-center justify-between border-b border-gray-200 bg-primary-600 p-4 text-white ${
            embedded ? '' : 'rounded-t-lg'
          }`}
        >
          <div className="flex min-w-0 items-center gap-2">
            <MessageSquare size={20} className="shrink-0" />
            <div className="min-w-0">
              <h3 className="truncate font-bold">
                {otherParticipant?.name || t('chat.title')}
              </h3>
              {otherParticipant?.role && (
                <p className="text-xs text-primary-100">{otherParticipant.role}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white transition hover:text-gray-200"
            aria-label={t('chat.close')}
          >
            <X size={20} />
          </button>
        </div>

        <div
          ref={chatContainerRef}
          className="flex-1 space-y-4 overflow-y-auto bg-gray-50 p-4"
        >
          {messages.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <p>{t('chat.empty')}</p>
              <p className="mt-2 text-sm">{t('chat.empty_hint')}</p>
            </div>
          ) : (
            messages.map((message) => {
              const isAi = Boolean(message.isAI);
              const senderId = message.sender?._id || message.sender;
              const isOwnMessage =
                !isAi && String(senderId) === String(user?._id);
              const attachment = message.attachments?.[0];
              const attachmentUrl = attachment?.url;
              const attachmentName =
                attachment?.name || message.content || 'Pièce jointe';

              return (
                <div
                  key={message._id}
                  className={`flex ${
                    isOwnMessage ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      isAi
                        ? 'border border-dashed border-slate-300 bg-slate-100 text-slate-800'
                        : isOwnMessage
                          ? 'bg-primary-600 text-white'
                          : 'border border-gray-200 bg-white text-gray-900'
                    }`}
                  >
                    {isAi && (
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded bg-slate-700 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                          {t('chat.ai_badge')}
                        </span>
                      </div>
                    )}
                    {!isOwnMessage && !isAi && (
                      <p className="mb-1 text-xs font-semibold opacity-75">
                        {message.sender?.name}
                      </p>
                    )}

                    {message.type === 'image' && attachmentUrl ? (
                      <img
                        src={attachmentUrl}
                        alt={attachmentName}
                        className="max-w-full cursor-pointer rounded"
                        onClick={() =>
                          setFullscreenImage({
                            url: attachmentUrl,
                            name: attachmentName,
                          })
                        }
                      />
                    ) : message.type === 'file' && attachmentUrl ? (
                      <a
                        href={attachmentUrl}
                        download={attachmentName}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 break-all text-sm underline"
                      >
                        <Paperclip size={16} className="shrink-0" />
                        {attachmentName}
                      </a>
                    ) : (
                      <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                    )}

                    {isAi && (
                      <p className="mt-2 text-[11px] leading-snug text-slate-500">
                        {t('chat.ai_disclaimer')}
                      </p>
                    )}
                    <div
                      className={`mt-1 flex items-center justify-end gap-1 text-xs ${
                        isOwnMessage ? 'text-primary-100' : 'text-gray-500'
                      }`}
                    >
                      <span>{formatTime(message.createdAt)}</span>
                      {isOwnMessage &&
                        (message.isRead ? (
                          <CheckCheck
                            size={15}
                            className="text-sky-300"
                            aria-label="Message lu"
                          />
                        ) : (
                          <Check size={15} aria-label="Message envoyé" />
                        ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {typingUserIds.length > 0 && (
            <div className="flex justify-start">
              <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-500">
                <span>en train d&apos;écrire</span>
                <span className="inline-flex w-5 justify-start">
                  <span className="animate-pulse">...</span>
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form
          onSubmit={handleSendMessage}
          className={`space-y-3 border-t border-gray-200 bg-white p-4 ${
            embedded ? '' : 'rounded-b-lg'
          }`}
        >
          {error && <div className="text-sm text-red-600">{error}</div>}

          <label className="flex cursor-pointer items-start gap-2 text-xs text-gray-600">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={aiAck}
              onChange={(event) => handleAckAi(event.target.checked)}
            />
            <span>{t('chat.ai_ack')}</span>
          </label>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(event) => handleFileSelect(event, 'file')}
          />
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => handleFileSelect(event, 'image')}
          />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || !aiAck}
              className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Joindre un fichier"
              title="Joindre un fichier"
            >
              <Paperclip size={20} />
            </button>
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={uploading || !aiAck}
              className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Joindre une image"
              title="Joindre une image"
            >
              <LucideImage size={20} />
            </button>
            <input
              type="text"
              value={newMessage}
              onChange={handleMessageChange}
              placeholder={
                uploading ? 'Envoi de la pièce jointe...' : t('chat.placeholder')
              }
              className="min-w-0 flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-primary-500"
              disabled={sending || uploading || !aiAck}
              aria-label={t('chat.placeholder')}
            />
            <button
              type="submit"
              disabled={
                !newMessage.trim() || sending || uploading || !aiAck
              }
              className="rounded-lg bg-primary-600 px-4 py-2 text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={t('chat.send')}
            >
              <Send size={20} />
            </button>
          </div>
        </form>
      </div>

      {fullscreenImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Aperçu de l'image"
          onClick={() => setFullscreenImage(null)}
        >
          <button
            type="button"
            onClick={() => setFullscreenImage(null)}
            className="absolute end-5 top-5 rounded-full bg-black/40 p-2 text-white hover:bg-black/60"
            aria-label="Fermer l'aperçu"
          >
            <X size={24} />
          </button>
          <img
            src={fullscreenImage.url}
            alt={fullscreenImage.name}
            className="max-h-full max-w-full rounded object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

export default ChatWidget;
