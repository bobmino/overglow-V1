import React, { useState, useEffect } from 'react';
import { X, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../config/axios';

const BadgeRequestModal = ({ isOpen, onClose, productId, productTitle }) => {
  const [badges, setBadges] = useState([]);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [justification, setJustification] = useState('');
  const [evidence, setEvidence] = useState({
    photos: [],
    documents: [],
    links: [],
  });
  const [linkInput, setLinkInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchManualBadges();
    }
  }, [isOpen]);

  const fetchManualBadges = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/badges?type=product');
      // Filtrer seulement les badges manuels (non automatiques)
      const manualBadges = data.filter(badge => !badge.isAutomatic);
      setBadges(manualBadges);
    } catch (error) {
      console.error('Failed to fetch badges:', error);
      setError('Impossible de charger les badges disponibles');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      files.forEach(file => formData.append('images', file));

      const { data } = await api.post('/api/upload/images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setEvidence(prev => ({
        ...prev,
        photos: [...prev.photos, ...(data.urls || data.images || [])],
      }));
    } catch (error) {
      console.error('Upload error:', error);
      setError('Erreur lors du téléchargement des images');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddLink = () => {
    if (linkInput.trim()) {
      setEvidence(prev => ({
        ...prev,
        links: [...prev.links, linkInput.trim()],
      }));
      setLinkInput('');
    }
  };

  const handleRemovePhoto = (index) => {
    setEvidence(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  const handleRemoveLink = (index) => {
    setEvidence(prev => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index),
    }));
  };

  const getRequestedFlags = (badge) => {
    const flags = {};
    if (badge.criteria.isArtisan) flags.isArtisan = true;
    if (badge.criteria.isEcoFriendly) flags.isEcoFriendly = true;
    if (badge.criteria.isTraditional) flags.isTraditional = true;
    if (badge.criteria.isAuthenticLocal) flags.isAuthenticLocal = true;
    if (badge.criteria.isLocal100) flags.isLocal100 = true;
    return flags;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedBadge) {
      setError('Veuillez sélectionner un badge');
      return;
    }

    if (!justification.trim()) {
      setError('Veuillez fournir une justification');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await api.post('/api/badge-requests', {
        productId,
        badgeId: selectedBadge._id,
        justification: justification.trim(),
        evidence,
        requestedFlags: getRequestedFlags(selectedBadge),
      });

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setSelectedBadge(null);
        setJustification('');
        setEvidence({ photos: [], documents: [], links: [] });
        setLinkInput('');
      }, 2000);
    } catch (error) {
      console.error('Submit error:', error);
      setError(error.response?.data?.message || 'Erreur lors de la soumission de la demande');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            Demander un badge pour "{productTitle}"
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
            aria-label="Fermer"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {success ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle className="text-green-600" size={24} />
              <div>
                <p className="font-semibold text-green-900">Demande soumise avec succès !</p>
                <p className="text-sm text-green-700">Un administrateur examinera votre demande.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Badge Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Sélectionner un badge *
                </label>
                {loading ? (
                  <div className="text-center py-4 text-gray-500">Chargement des badges...</div>
                ) : badges.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    Aucun badge disponible pour demande
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {badges.map((badge) => (
                      <button
                        key={badge._id}
                        type="button"
                        onClick={() => setSelectedBadge(badge)}
                        className={`p-4 rounded-lg border-2 transition text-left ${
                          selectedBadge?._id === badge._id
                            ? 'border-primary-600 bg-primary-50'
                            : 'border-gray-200 hover:border-primary-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{badge.icon}</span>
                          <div>
                            <h3 className="font-bold text-gray-900">{badge.name}</h3>
                            <p className="text-sm text-gray-600">{badge.description}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Justification */}
              <div>
                <label htmlFor="justification" className="block text-sm font-bold text-gray-700 mb-2">
                  Justification *
                </label>
                <textarea
                  id="justification"
                  name="justification"
                  rows={4}
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Expliquez pourquoi votre produit mérite ce badge (ex: techniques artisanales utilisées, pratiques éco-responsables, etc.)"
                  required
                  aria-label="Justification de la demande de badge"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {justification.length}/1000 caractères
                </p>
              </div>

              {/* Evidence - Photos */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Preuves - Photos
                </label>
                <div className="flex flex-wrap gap-3 mb-3">
                  {evidence.photos.map((photo, index) => (
                    <div key={index} className="relative">
                      <img
                        src={photo}
                        alt={`Preuve ${index + 1}`}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                        aria-label="Supprimer la photo"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <label className="border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center h-24 cursor-pointer hover:border-primary-500 transition">
                  <Upload className="text-gray-400 mb-1" size={20} />
                  <span className="text-xs text-gray-500">
                    {submitting ? 'Téléchargement...' : 'Ajouter des photos'}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={submitting}
                  />
                </label>
              </div>

              {/* Evidence - Links */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Preuves - Liens (certifications, articles, etc.)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="url"
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLink())}
                    placeholder="https://..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    aria-label="Ajouter un lien"
                  />
                  <button
                    type="button"
                    onClick={handleAddLink}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Ajouter
                  </button>
                </div>
                {evidence.links.length > 0 && (
                  <div className="space-y-1">
                    {evidence.links.map((link, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded"
                      >
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary-600 hover:underline truncate flex-1"
                        >
                          {link}
                        </a>
                        <button
                          type="button"
                          onClick={() => handleRemoveLink(index)}
                          className="text-red-500 hover:text-red-700 ml-2"
                          aria-label="Supprimer le lien"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                  <AlertCircle className="text-red-600" size={20} />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedBadge || !justification.trim()}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Envoi...' : 'Soumettre la demande'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default BadgeRequestModal;

