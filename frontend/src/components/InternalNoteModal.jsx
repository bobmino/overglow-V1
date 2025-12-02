import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import api from '../config/axios';

const InternalNoteModal = ({ booking, isOpen, onClose, onSaved }) => {
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (booking && isOpen) {
      setNote(booking.internalNote || '');
      setError('');
    }
  }, [booking, isOpen]);

  const handleSave = async () => {
    setLoading(true);
    setError('');
    
    try {
      await api.put(`/api/bookings/${booking._id}/note`, { note });
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save note');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-gray-900">Note interne</h3>
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

        <div className="mb-4">
          <label htmlFor="internal-note" className="block text-sm font-semibold text-gray-700 mb-2">
            Note pour la réservation: {booking.schedule?.product?.title}
          </label>
          <textarea
            id="internal-note"
            name="internal-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
            placeholder="Ajoutez une note interne pour cette réservation..."
            disabled={loading}
            aria-label="Note interne pour la réservation"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              'Enregistrement...'
            ) : (
              <>
                <Save size={16} />
                Enregistrer
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InternalNoteModal;

