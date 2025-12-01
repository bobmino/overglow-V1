import React from 'react';
import { Star } from 'lucide-react';

const ReviewItem = ({ review }) => {
  return (
    <div className="border-b border-gray-200 py-6 last:border-b-0">
      <div className="flex items-center mb-3">
        <div className="flex items-center mr-3">
          {[...Array(5)].map((_, i) => (
            <Star 
              key={i} 
              size={16} 
              className={i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}
            />
          ))}
        </div>
        <span className="font-bold text-gray-900">{review.rating}.0</span>
      </div>
      
      <p className="text-gray-700 mb-2">{review.comment}</p>
      
      <div className="flex items-center text-sm text-gray-500">
        <span className="font-semibold">{review.user?.name || 'Anonymous'}</span>
        <span className="mx-2">•</span>
        <span>{new Date(review.createdAt).toLocaleDateString('fr-FR')}</span>
      </div>
    </div>
  );
};

const ReviewsList = ({ reviews }) => {
  const reviewsArray = Array.isArray(reviews) ? reviews : [];
  
  if (reviewsArray.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <p className="text-gray-600">No reviews yet. Be the first to review!</p>
      </div>
    );
  }

  const averageRating = (reviewsArray.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewsArray.length).toFixed(1);

  return (
    <div>
      <div className="flex items-center mb-6">
        <h3 className="font-bold text-2xl mr-4">Reviews</h3>
        <div className="flex items-center">
          <Star size={20} className="text-yellow-500 fill-yellow-500 mr-1" />
          <span className="font-bold text-lg">{averageRating}</span>
          <span className="text-gray-500 ml-2">({reviews.length} reviews)</span>
        </div>
      </div>

      <div className="space-y-0">
        {reviewsArray.map((review) => (
          <ReviewItem key={review._id || Math.random()} review={review} />
        ))}
      </div>
    </div>
  );
};

export default ReviewsList;
