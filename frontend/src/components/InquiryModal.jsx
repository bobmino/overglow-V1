import React, { useState } from 'react';
import { X, Send, MessageSquare } from 'lucide-react';
import api from '../config/axios';

const InquiryModal = ({ product, isOpen, onClose, onSubmitted }) => {
  const [question, setQuestion] = useState('');
  const [type, setType] = useState('manual');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/api/inquiries', {
        productId: product._id,
        question: type === 'manual' ? question : undefined,
        type,
      });
      setQuestion('');
      onSubmitted();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send inquiry');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-gray-900">Envoyer une inquiry</h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="inquiry-type" className="block text-sm font-semibold text-gray-700 mb-2">
              Type d'inquiry
            </label>
            <select
              id="inquiry-type"
              name="inquiry-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600"
              disabled={loading}
              aria-label="Type d'inquiry"
            >
              <option value="manual">Manuelle (Poser une question)</option>
              <option value="automatic">Automatique (Demander validation)</option>
            </select>
          </div>

          {type === 'manual' && (
            <div className="mb-4">
              <label htmlFor="inquiry-question" className="block text-sm font-semibold text-gray-700 mb-2">
                Votre question
              </label>
              <textarea
                id="inquiry-question"
                name="inquiry-question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600"
                placeholder="Posez votre question sur ce produit..."
                required
                disabled={loading}
                aria-label="Votre question"
              />
            </div>
          )}

          {type === 'automatic' && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
              <MessageSquare size={16} className="inline mr-2" />
              Vous demandez une validation automatique pour ce produit. L'opérateur devra approuver votre demande.
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || (type === 'manual' && !question.trim())}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                'Envoi...'
              ) : (
                <>
                  <Send size={16} />
                  Envoyer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InquiryModal;

