import React, { useState, useEffect } from 'react';
import api from '../config/axios';
import { MessageSquare, Clock, CheckCircle, XCircle, Send } from 'lucide-react';
import ScrollToTopButton from '../components/ScrollToTopButton';
import DashboardNavBar from '../components/DashboardNavBar';

const InquiryCard = ({ inquiry, onUpdate }) => {
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAnswer = async () => {
    if (!answer.trim()) return;
    setLoading(true);
    try {
      await api.put(`/api/inquiries/${inquiry._id}/answer`, { answer });
      onUpdate();
    } catch (error) {
      alert('Failed to send answer');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setLoading(true);
    try {
      await api.put(`/api/inquiries/${inquiry._id}/approve`);
      onUpdate();
    } catch (error) {
      alert('Failed to approve inquiry');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt('Reason for rejection:');
    if (!reason) return;
    setLoading(true);
    try {
      await api.put(`/api/inquiries/${inquiry._id}/reject`, { reason });
      onUpdate();
    } catch (error) {
      alert('Failed to reject inquiry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-lg text-gray-900 mb-1">
            {inquiry.product?.title}
          </h3>
          <p className="text-sm text-gray-600">
            De: {inquiry.user?.name || inquiry.user?.email}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
          inquiry.type === 'manual' 
            ? (inquiry.answer ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800')
            : (inquiry.status === 'approved' ? 'bg-green-100 text-green-800' : 
               inquiry.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800')
        }`}>
          {inquiry.type === 'manual' 
            ? (inquiry.answer ? 'Répondu' : 'En attente')
            : inquiry.status}
        </span>
      </div>

      {inquiry.type === 'manual' && inquiry.question && (
        <div className="mb-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">Question:</p>
          <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{inquiry.question}</p>
        </div>
      )}

      {inquiry.type === 'manual' && inquiry.answer && (
        <div className="mb-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">Réponse:</p>
          <p className="text-gray-700 bg-green-50 p-3 rounded-lg">{inquiry.answer}</p>
        </div>
      )}

      {inquiry.type === 'automatic' && (
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Demande de validation automatique pour ce produit
          </p>
        </div>
      )}

      {inquiry.type === 'manual' && !inquiry.answer && (
        <div className="space-y-3">
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={3}
            placeholder="Votre réponse..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600"
          />
          <button
            onClick={handleAnswer}
            disabled={loading || !answer.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50"
          >
            <Send size={16} />
            Envoyer la réponse
          </button>
        </div>
      )}

      {inquiry.type === 'automatic' && inquiry.status === 'pending' && (
        <div className="flex gap-3">
          <button
            onClick={handleApprove}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
          >
            <CheckCircle size={16} />
            Approuver
          </button>
          <button
            onClick={handleReject}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50"
          >
            <XCircle size={16} />
            Rejeter
          </button>
        </div>
      )}

      <div className="mt-4 pt-4 border-t text-xs text-gray-500">
        <Clock size={12} className="inline mr-1" />
        {new Date(inquiry.createdAt).toLocaleDateString('fr-FR')}
      </div>
    </div>
  );
};

const InquiriesPage = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInquiries = async () => {
    try {
      const { data } = await api.get('/api/inquiries/operator');
      // Ensure data is an array
      const inquiriesArray = Array.isArray(data) ? data : [];
      setInquiries(inquiriesArray);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch inquiries:', error);
      setInquiries([]); // Set empty array on error
      setLoading(false);
    }
  };

  useEffect(() => {
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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Inquiries</h1>
        <DashboardNavBar />
      </div>

      {!Array.isArray(inquiries) || inquiries.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-12 text-center">
          <MessageSquare size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">No inquiries yet</h2>
          <p className="text-gray-600">Inquiries from customers will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inquiry) => (
            <InquiryCard key={inquiry?._id || Math.random()} inquiry={inquiry} onUpdate={fetchInquiries} />
          ))}
        </div>
      )}

      <ScrollToTopButton />
    </div>
  );
};

export default InquiriesPage;

