import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../config/axios';
import { MessageSquare, Clock, CheckCircle, XCircle } from 'lucide-react';
import ScrollToTopButton from '../components/ScrollToTopButton';
import { Link } from 'react-router-dom';
import ChatWidget from '../components/ChatWidget';
import { logger } from '../utils/logger.js';

const getDateLocale = (language) => {
  const locale = language?.slice(0, 2) || 'fr';
  if (locale === 'ar') return 'ar-MA';
  if (locale === 'es') return 'es-ES';
  if (locale === 'en') return 'en-GB';
  return 'fr-FR';
};

const MyInquiryCard = ({ inquiry, onOpenChat }) => {
  const { t, i18n } = useTranslation();
  const dateLocale = getDateLocale(i18n.language);

  const getStatusLabel = () => {
    if (inquiry.type === 'manual') {
      return inquiry.answer ? t('my_inquiries.status.answered') : t('my_inquiries.status.pending');
    }
    return t(`my_inquiries.status.${inquiry.status}`, { defaultValue: inquiry.status });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <Link to={`/products/${inquiry.product?._id}`}>
            <h3 className="font-bold text-lg text-gray-900 mb-1 hover:text-primary-600">
              {inquiry.product?.title}
            </h3>
          </Link>
          <p className="text-sm text-gray-600">
            {t('my_inquiries.operator', { name: inquiry.operator?.companyName || t('admin.common.na') })}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
          inquiry.type === 'manual'
            ? (inquiry.answer ? 'bg-primary-100 text-primary-800' : 'bg-yellow-100 text-yellow-800')
            : (inquiry.status === 'approved' ? 'bg-primary-100 text-primary-800' :
               inquiry.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800')
        }`}>
          {getStatusLabel()}
        </span>
      </div>

      {inquiry.type === 'manual' && inquiry.question && (
        <div className="mb-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">{t('my_inquiries.your_question')}</p>
          <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{inquiry.question}</p>
        </div>
      )}

      {inquiry.type === 'manual' && inquiry.answer && (
        <div className="mb-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">{t('my_inquiries.answer')}</p>
          <p className="text-gray-700 bg-primary-50 p-3 rounded-lg">{inquiry.answer}</p>
        </div>
      )}

      {inquiry.type === 'automatic' && inquiry.status === 'approved' && (
        <div className="mb-4 p-3 bg-primary-50 rounded-lg">
          <CheckCircle size={16} className="inline me-2 text-primary-700" />
          <span className="text-primary-700 font-semibold">{t('my_inquiries.approved')}</span>
        </div>
      )}

      {inquiry.type === 'automatic' && inquiry.status === 'rejected' && (
        <div className="mb-4 p-3 bg-red-50 rounded-lg">
          <XCircle size={16} className="inline me-2 text-red-700" />
          <span className="text-red-700 font-semibold">{t('my_inquiries.rejected')}</span>
          {inquiry.rejectionReason && (
            <p className="text-red-600 text-sm mt-1">
              {t('my_inquiries.rejection_reason', { reason: inquiry.rejectionReason })}
            </p>
          )}
        </div>
      )}

      <div className="mt-4 pt-4 border-t flex items-center justify-between">
        <div className="text-xs text-gray-500">
          <Clock size={12} className="inline me-1" />
          {new Date(inquiry.createdAt).toLocaleDateString(dateLocale)}
        </div>
        <button
          onClick={() => onOpenChat(inquiry._id)}
          className="flex items-center gap-2 px-3 py-1 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition"
          aria-label={t('my_inquiries.open_chat')}
        >
          <MessageSquare size={16} />
          {t('my_inquiries.chat')}
        </button>
      </div>
    </div>
  );
};

const MyInquiriesPage = () => {
  const { t } = useTranslation();
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openChatId, setOpenChatId] = useState(null);

  useEffect(() => {
    const fetchInquiries = async () => {
      try {
        const { data } = await api.get('/api/inquiries/my-inquiries');
        setInquiries(data);
        setLoading(false);
      } catch (error) {
        logger.error('Failed to fetch inquiries:', error);
        setLoading(false);
      }
    };

    fetchInquiries();
  }, []);

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
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('my_inquiries.title')}</h1>

      {inquiries.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-12 text-center">
          <MessageSquare size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('my_inquiries.empty_title')}</h2>
          <p className="text-gray-600">{t('my_inquiries.empty_desc')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inquiry) => (
            <MyInquiryCard
              key={inquiry._id}
              inquiry={inquiry}
              onOpenChat={setOpenChatId}
            />
          ))}
        </div>
      )}

      {openChatId && (
        <ChatWidget
          inquiryId={openChatId}
          onClose={() => setOpenChatId(null)}
        />
      )}

      <ScrollToTopButton />
    </div>
  );
};

export default MyInquiriesPage;
