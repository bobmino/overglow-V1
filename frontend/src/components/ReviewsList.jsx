import React, { useState } from 'react';
import api from '../config/axios';
import { Star, ThumbsUp, ThumbsDown, CheckCircle, Image as ImageIcon, Filter, Flag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ReviewItem = ({ review, onVote }) => {
  const { user } = useAuth();
  const [hasVotedHelpful, setHasVotedHelpful] = useState(
    user && review.helpfulVoters?.some(v => v.toString() === user._id)
  );
  const [hasVotedNotHelpful, setHasVotedNotHelpful] = useState(
    user && review.notHelpfulVoters?.some(v => v.toString() === user._id)
  );
  const [helpfulVotes, setHelpfulVotes] = useState(review.helpfulVotes || 0);

  const handleVote = async (helpful) => {
    if (!user) {
      alert('Veuillez vous connecter pour voter');
      return;
    }
    
    try {
      const { data } = await api.post(`/api/reviews/${review._id}/vote`, { helpful });
      setHelpfulVotes(data.helpfulVotes || 0);
      setHasVotedHelpful(helpful === true);
      setHasVotedNotHelpful(helpful === false);
      if (onVote) onVote();
    } catch (error) {
      console.error('Vote error:', error);
      alert(error.response?.data?.message || 'Erreur lors du vote');
    }
  };

  const handleReport = async () => {
    if (!user) {
      alert('Veuillez vous connecter pour signaler');
      return;
    }
    
    const reason = prompt('Raison du signalement:\n1. spam\n2. inappropriate\n3. fake\n4. offensive\n5. other\n\nEntrez le numéro ou la raison:');
    if (!reason) return;
    
    const reasonMap = {
      '1': 'spam',
      '2': 'inappropriate',
      '3': 'fake',
      '4': 'offensive',
      '5': 'other',
      'spam': 'spam',
      'inappropriate': 'inappropriate',
      'fake': 'fake',
      'offensive': 'offensive',
      'other': 'other',
    };
    
    const mappedReason = reasonMap[reason.toLowerCase()] || 'other';
    const description = prompt('Description (optionnel):');
    
    try {
      await api.post(`/api/reviews/${review._id}/report`, {
        reason: mappedReason,
        description: description || '',
      });
      alert('Review signalée avec succès. Merci pour votre contribution.');
    } catch (error) {
      console.error('Report error:', error);
      alert(error.response?.data?.message || 'Erreur lors du signalement');
    }
  };

  return (
    <div className="border-b border-gray-200 py-6 last:border-b-0">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center">
            {Array.isArray([1, 2, 3, 4, 5]) && [1, 2, 3, 4, 5].map((star) => (
              <Star 
                key={star} 
                size={16} 
                className={star <= review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}
              />
            ))}
          </div>
          <span className="font-bold text-gray-900">{review.rating}.0</span>
          {review.isVerified && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
              <CheckCircle size={12} />
              Vérifié
            </span>
          )}
        </div>
        <div className="text-sm text-gray-500">
          {new Date(review.createdAt).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}
        </div>
      </div>
      
      <p className="text-gray-700 mb-3">{review.comment}</p>
      
      {/* Review Photos */}
      {Array.isArray(review.photos) && review.photos.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mb-3">
          {review.photos.slice(0, 4).map((photo, index) => (
            <img
              key={index}
              src={photo}
              alt={`Review photo ${index + 1}`}
              className="w-full h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition"
              onClick={() => window.open(photo, '_blank')}
            />
          ))}
        </div>
      )}
      
      {/* Operator Response */}
      {review.operatorResponse && review.operatorResponse.message && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg mb-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-blue-900">Réponse de l'opérateur</span>
            <span className="text-xs text-blue-600">
              {new Date(review.operatorResponse.respondedAt).toLocaleDateString('fr-FR')}
            </span>
          </div>
          <p className="text-blue-800">{review.operatorResponse.message}</p>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center text-sm text-gray-500">
          <span className="font-semibold">{review.user?.name || 'Anonymous'}</span>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => handleVote(true)}
            disabled={hasVotedHelpful}
            className={`flex items-center gap-1 text-sm transition ${
              hasVotedHelpful
                ? 'text-green-600 font-semibold cursor-default'
                : 'text-gray-500 hover:text-green-600 cursor-pointer'
            }`}
            title={hasVotedHelpful ? 'Vous avez déjà voté utile' : 'Marquer comme utile'}
          >
            <ThumbsUp size={16} className={hasVotedHelpful ? 'fill-current' : ''} />
            <span>Utile ({helpfulVotes})</span>
          </button>
          <button
            onClick={handleReport}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 cursor-pointer transition"
            title="Signaler cette review"
          >
            <Flag size={16} />
            <span className="hidden sm:inline">Signaler</span>
          </button>
          {user && user.role === 'Opérateur' && !review.operatorResponse && (
            <button
              onClick={() => {
                const response = prompt('Votre réponse à ce commentaire:');
                if (response && response.trim()) {
                  api.post(`/api/reviews/${review._id}/response`, { message: response.trim() })
                    .then(() => {
                      alert('Réponse ajoutée avec succès');
                      window.location.reload();
                    })
                    .catch(err => alert('Erreur: ' + (err.response?.data?.message || 'Échec de l\'ajout de la réponse')));
                }
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Répondre
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const ReviewsList = ({ reviews: initialReviews = [], productId }) => {
  const [reviews, setReviews] = useState(initialReviews);
  const [filter, setFilter] = useState('all'); // all, with-photos, verified
  const [sort, setSort] = useState('helpful'); // helpful, recent, rating

  React.useEffect(() => {
    const fetchReviews = async () => {
      if (!productId) return;
      try {
        const params = new URLSearchParams();
        if (filter !== 'all') params.append('filter', filter);
        if (sort) params.append('sort', sort);
        
        const { data } = await api.get(`/api/products/${productId}/reviews?${params.toString()}`);
        setReviews(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch reviews:', error);
      }
    };
    fetchReviews();
  }, [productId, filter, sort]);

  if (!Array.isArray(reviews) || reviews.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <p className="text-gray-600">Aucun avis pour le moment. Soyez le premier à donner votre avis !</p>
      </div>
    );
  }

  const averageRating = (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1);
  const verifiedCount = reviews.filter(r => r.isVerified).length;
  const withPhotosCount = reviews.filter(r => Array.isArray(r.photos) && r.photos.length > 0).length;

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div className="flex items-center">
          <h3 className="font-bold text-2xl mr-4">Avis</h3>
          <div className="flex items-center">
            <Star size={20} className="text-yellow-500 fill-yellow-500 mr-1" />
            <span className="font-bold text-lg">{averageRating}</span>
            <span className="text-gray-500 ml-2">({reviews.length} avis)</span>
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-wrap gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">Tous les avis</option>
            <option value="with-photos">Avec photos ({withPhotosCount})</option>
            <option value="verified">Vérifiés ({verifiedCount})</option>
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
          >
            <option value="helpful">Plus utiles</option>
            <option value="recent">Plus récents</option>
            <option value="rating">Meilleure note</option>
          </select>
        </div>
      </div>

      <div className="space-y-0">
        {reviews.map((review) => (
          <ReviewItem 
            key={review._id} 
            review={review}
            onVote={() => {
              // Refresh reviews after vote
              const fetchReviews = async () => {
                try {
                  const { data } = await api.get(`/api/products/${productId}/reviews?filter=${filter}&sort=${sort}`);
                  setReviews(Array.isArray(data) ? data : []);
                } catch (error) {
                  console.error('Failed to refresh reviews:', error);
                }
              };
              fetchReviews();
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default ReviewsList;
