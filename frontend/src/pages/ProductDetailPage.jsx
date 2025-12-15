import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../config/axios';
import { useCurrency } from '../context/CurrencyContext';
import { 
  MapPin, Clock, Star, CheckCircle, Users, Calendar as CalendarIcon, 
  X, ChevronDown, ChevronRight, Award, TrendingUp, Shield, Camera
} from 'lucide-react';
import ImageGallery from '../components/ImageGallery';
import DatePicker from '../components/DatePicker';
import TimeSlotPicker from '../components/TimeSlotPicker';
import ReviewsList from '../components/ReviewsList';
import ProductCard from '../components/ProductCard';
import InquiryModal from '../components/InquiryModal';
import BadgeDisplay from '../components/BadgeDisplay';
import CancellationPolicy from '../components/CancellationPolicy';
import FavoriteButton from '../components/FavoriteButton';
import OthersAlsoBooked from '../components/OthersAlsoBooked';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [numberOfTickets, setNumberOfTickets] = useState(1);
  const [availableSchedules, setAvailableSchedules] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [productBadges, setProductBadges] = useState([]);
  const [operatorBadges, setOperatorBadges] = useState([]);
  const { formatPrice } = useCurrency();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await api.get(`/api/products/${id}`);
        setProduct(data);
        setAvailableSchedules(Array.isArray(data?.schedules) ? data.schedules : []);
        
        // Record view in history (if user is authenticated)
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo && data?._id) {
          try {
            await api.post('/api/view-history', { productId: data._id });
          } catch (err) {
            // Silently fail - view history is optional
            console.log('Could not record view:', err);
          }
        }
        
        // Fetch product badges
        if (data?._id) {
          try {
            const { data: badgesData } = await api.get(`/api/badges/product/${data._id}`);
            setProductBadges(Array.isArray(badgesData) ? badgesData : []);
          } catch (err) {
            console.error('Failed to load product badges:', err);
          }
          
          // Fetch operator badges if operator exists
          if (data?.operator?._id) {
            try {
              const { data: operatorBadgesData } = await api.get(`/api/badges/operator/${data.operator._id}`);
              setOperatorBadges(Array.isArray(operatorBadgesData) ? operatorBadgesData : []);
            } catch (err) {
              console.error('Failed to load operator badges:', err);
            }
          }
        }
        
        setLoading(false);
        
        // Fetch related products with improved similarity logic
        try {
          const { data: allProductsData } = await api.get('/api/products');
          const allProducts = Array.isArray(allProductsData) ? allProductsData : [];
          
          // Filter out current product and unpublished products
          const availableProducts = allProducts.filter(p => 
            p._id !== id && 
            p.status === 'published' &&
            p.price && 
            Number(p.price) > 0
          );
          
          if (availableProducts.length > 0) {
            // Score products based on similarity
            const scoredProducts = availableProducts.map(p => {
              let score = 0;
              
              // Higher priority: same city AND same category (score: 10)
              if (p.city === data?.city && p.category === data?.category) {
                score += 10;
              }
              // Medium priority: same category (score: 5)
              else if (p.category === data?.category) {
                score += 5;
              }
              // Lower priority: same city (score: 3)
              else if (p.city === data?.city) {
                score += 3;
              }
              
              // Bonus for similar price range (within 30% of current product price)
              const currentPrice = parsePrice(data?.price) || 0;
              const productPrice = parsePrice(p.price) || 0;
              if (currentPrice > 0 && productPrice > 0) {
                const priceDiff = Math.abs(currentPrice - productPrice) / currentPrice;
                if (priceDiff <= 0.3) {
                  score += 2;
                }
              }
              
              // Bonus if operator is the same
              if (p.operator?._id === data?.operator?._id) {
                score += 1;
              }
              
              return { product: p, score };
            });
            
            // Sort by score (descending) and take top 4
            const related = scoredProducts
              .sort((a, b) => b.score - a.score)
              .slice(0, 4)
              .map(item => item.product);
            
            setRelatedProducts(related);
          } else {
            setRelatedProducts([]);
          }
        } catch (err) {
          console.error('Failed to load related products:', err);
          setRelatedProducts([]);
        }
      } catch (err) {
        console.error('Failed to load product:', err);
        setError('Failed to load product');
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const parsePrice = (value) => {
    const numericPrice = Number(value);
    return Number.isFinite(numericPrice) && numericPrice >= 0 ? numericPrice : null;
  };

  const getMinPrice = () => {
    if (!product) return null;
    if (availableSchedules.length === 0) return parsePrice(product.price);
    const prices = availableSchedules
      .map(schedule => parsePrice(schedule.price))
      .filter(price => price !== null);
    if (prices.length > 0) {
      return Math.min(...prices);
    }
    return parsePrice(product.price);
  };

  const handleBookNow = () => {
    if (!selectedDate) {
      alert('Veuillez sélectionner une date');
      return;
    }
    if (!selectedTimeSlot) {
      alert('Veuillez sélectionner une plage horaire');
      return;
    }
    navigate('/booking', {
      state: {
        product,
        date: selectedDate,
        timeSlot: selectedTimeSlot,
        tickets: numberOfTickets
      }
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 pt-24">
        <div className="animate-pulse space-y-4">
          <div className="h-96 bg-slate-200 rounded-xl"></div>
          <div className="h-8 bg-slate-200 rounded w-3/4"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-12 pt-24">
        <div className="bg-red-50 text-red-700 p-6 rounded-lg">
          {error || 'Product not found'}
        </div>
      </div>
    );
  }

  const highlights = Array.isArray(product?.highlights) && product.highlights.length > 0
    ? product.highlights
    : [
        "Skip-the-line access",
        "Expert local guide",
        "Small group experience",
        "Free cancellation up to 24 hours"
      ];

  const included = Array.isArray(product?.included) && product.included.length > 0
    ? product.included
    : [
        { item: "Hotel pickup and drop-off", included: true },
        { item: "Professional tour guide", included: true },
        { item: "Entrance tickets", included: true },
        { item: "Audio headset", included: true },
        { item: "Food and drinks", included: false },
        { item: "Gratuities", included: false }
      ];

  const itinerary = Array.isArray(product?.itinerary) && product.itinerary.length > 0
    ? product.itinerary
    : [
        { 
          stop: "Eiffel Tower", 
          duration: "30 min", 
          description: "Start your tour with stunning views of Paris's most iconic landmark. Perfect photo opportunity!" 
        },
        { 
          stop: "Louvre Museum", 
          duration: "45 min", 
          description: "Explore the world's largest art museum and see the Mona Lisa up close." 
        },
        { 
          stop: "Notre-Dame Cathedral", 
          duration: "20 min", 
          description: "Visit the famous Gothic cathedral and learn about its rich history." 
        }
      ];

  const faqs = Array.isArray(product?.faqs) && product.faqs.length > 0
    ? product.faqs
    : [
        { 
          q: "What should I bring?", 
          a: "We recommend comfortable walking shoes, a water bottle, sunscreen, and a camera. Don't forget your confirmation voucher!" 
        },
        { 
          q: "Is this tour wheelchair accessible?", 
          a: "Yes, this tour is wheelchair accessible. Please inform us in advance so we can make necessary arrangements." 
        },
        { 
          q: "What's the cancellation policy?", 
          a: "Free cancellation up to 24 hours before the experience starts. Cancel at least 24 hours before the start time for a full refund." 
        },
        { 
          q: "What languages are available?", 
          a: "This tour is available in English, French, Spanish, German, and Italian. Please select your preferred language when booking." 
        }
      ];

  const minPrice = getMinPrice();
  const hasValidPrice = typeof minPrice === 'number';
  const formattedMinPrice = hasValidPrice ? formatPrice(minPrice, 'EUR') : null;

  return (
    <div className="bg-slate-50">
      <div className="container mx-auto px-4 py-8 pt-24">
        {/* Breadcrumb */}
        <nav className="text-sm text-slate-600 mb-4">
          <Link to="/" className="hover:text-primary-600">Home</Link>
          <ChevronRight size={14} className="inline mx-2" />
          <Link to={`/search?city=${product.city}`} className="hover:text-primary-600">{product.city}</Link>
          <ChevronRight size={14} className="inline mx-2" />
          <Link to={`/search?category=${product.category}`} className="hover:text-primary-600">{product.category}</Link>
          <ChevronRight size={14} className="inline mx-2" />
          <span className="text-slate-900 font-medium truncate">{product.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <ImageGallery images={product.images} />

            {/* Product Header */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                {Array.isArray(productBadges) && productBadges.length > 0 && (
                  <BadgeDisplay badges={productBadges} size="md" showLabel={true} />
                )}
                {Array.isArray(operatorBadges) && operatorBadges.length > 0 && (
                  <BadgeDisplay badges={operatorBadges} size="md" showLabel={true} />
                )}
              </div>

              <div className="flex items-center text-slate-600 text-sm mb-2">
                <MapPin size={16} className="mr-1" />
                {product.city} • {product.category}
              </div>
              
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 flex-1">
                  {product.title}
                </h1>
                <FavoriteButton productId={product._id} size={28} />
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <Star size={18} className="text-yellow-500 fill-yellow-500 mr-1" />
                  <span className="font-bold">4.8</span>
                  <span className="text-slate-500 ml-1">(2,451 reviews)</span>
                </div>
                <div className="flex items-center text-slate-600">
                  <Clock size={16} className="mr-1" />
                  <span>3-4 hours</span>
                </div>
              </div>

              {/* Urgency Message */}
              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-700">
                  <span className="font-bold">Popular:</span> Booked 127 times in the last 24 hours
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-2xl font-bold mb-4">About this experience</h2>
              <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>

            {/* What's Included */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-2xl font-bold mb-4">What's Included</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Array.isArray(included) && included.map((item, idx) => (
                  <div key={idx} className="flex items-start">
                    {item.included ? (
                      <CheckCircle className="text-green-600 mr-3 mt-0.5 flex-shrink-0" size={20} />
                    ) : (
                      <X className="text-red-500 mr-3 mt-0.5 flex-shrink-0" size={20} />
                    )}
                    <span className={item.included ? 'text-slate-700' : 'text-slate-400 line-through'}>
                      {item.item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Highlights */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-2xl font-bold mb-4">Highlights</h2>
              <ul className="space-y-3">
                {Array.isArray(highlights) && highlights.map((highlight, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle size={20} className="text-primary-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Itinerary */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-2xl font-bold mb-4">Itinerary</h2>
              <div className="space-y-4">
                {Array.isArray(itinerary) && itinerary.map((stop, idx) => (
                  <div key={idx} className="flex gap-4 pb-4 border-b border-slate-200 last:border-0">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-lg">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1">{stop.stop}</h3>
                      <p className="text-sm text-slate-600 mb-2 flex items-center">
                        <Clock size={14} className="inline mr-1" />
                        {stop.duration}
                      </p>
                      <p className="text-slate-700">{stop.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trust & Guarantees */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-2xl font-bold mb-4">Garanties et Certifications</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                  <Shield size={24} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-green-900 mb-1">Garantie Prix Bas</h3>
                    <p className="text-sm text-green-700">Meilleur prix garanti ou remboursement de la différence</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <CheckCircle size={24} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-blue-900 mb-1">Annulation Gratuite</h3>
                    <p className="text-sm text-blue-700">Annulez jusqu'à 24h avant pour un remboursement complet</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <Award size={24} className="text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-purple-900 mb-1">Opérateur Vérifié</h3>
                    <p className="text-sm text-purple-700">Tous nos opérateurs sont vérifiés et certifiés</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <TrendingUp size={24} className="text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-orange-900 mb-1">Support 24/7</h3>
                    <p className="text-sm text-orange-700">Assistance client disponible à tout moment</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cancellation Policy */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-2xl font-bold mb-4">Politique d'Annulation</h2>
              <CancellationPolicy 
                policy={product.cancellationPolicy}
              />
            </div>

            {/* FAQ */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
              <div className="space-y-3">
                {Array.isArray(faqs) && faqs.map((faq, idx) => (
                  <div key={idx} className="border border-slate-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                      className="w-full p-4 text-left font-medium flex justify-between items-center hover:bg-slate-50 transition"
                    >
                      {faq.q}
                      <ChevronDown 
                        className={`transition-transform ${expandedFaq === idx ? 'rotate-180' : ''}`} 
                        size={20} 
                      />
                    </button>
                    {expandedFaq === idx && (
                      <div className="px-4 pb-4 text-slate-700 border-t border-slate-100 pt-3">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Inquiry Section */}
            {product.requiresInquiry && product.inquiryType !== 'none' && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-2xl font-bold mb-4">Questions ou validation requise</h2>
                <p className="text-slate-700 mb-4">
                  Ce produit nécessite une inquiry {product.inquiryType === 'manual' ? '(question/réponse)' : '(validation automatique)'}.
                </p>
                <button
                  onClick={() => setShowInquiryModal(true)}
                  className="px-6 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition"
                >
                  Envoyer une inquiry
                </button>
              </div>
            )}

            {/* Reviews */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <ReviewsList reviews={product.reviews || []} productId={product._id} />
            </div>

            {/* Related Products */}
            {Array.isArray(relatedProducts) && relatedProducts.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-2xl font-bold mb-6">Produits similaires</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {relatedProducts.map(relatedProduct => (
                    <ProductCard key={relatedProduct._id} product={relatedProduct} />
                  ))}
                </div>
              </div>
            )}
            
            {/* Others Also Booked */}
            <OthersAlsoBooked productId={product._id} />
          </div>

          {/* Booking Widget (Sidebar) - Desktop */}
          <div className="lg:col-span-1 hidden lg:block">
            <div className="sticky top-24 bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-lg">
              {/* Cancellation Policy */}
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center text-green-700 mb-1">
                  <CheckCircle size={18} className="mr-2" />
                  <span className="font-bold">Free cancellation</span>
                </div>
                <p className="text-sm text-green-600">
                  Cancel up to 24 hours in advance for a full refund
                </p>
              </div>

              {/* Price Display */}
              <div className="mb-6">
                <p className="text-sm text-slate-600 mb-1">From</p>
                {hasValidPrice ? (
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-slate-900">{formattedMinPrice}</span>
                    <span className="text-slate-600">per person</span>
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm">Price unavailable. Please contact support.</p>
                )}
              </div>

              {/* Date Picker */}
              <div className="mb-4">
                <DatePicker 
                  onDateSelect={setSelectedDate}
                  selectedDate={selectedDate}
                />
              </div>

              {/* Time Slot Picker */}
              <div className="mb-6">
                <TimeSlotPicker
                  product={product}
                  selectedTimeSlot={selectedTimeSlot}
                  onTimeSlotSelect={setSelectedTimeSlot}
                  required={true}
                />
              </div>

              {/* Tickets Selector */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-3">
                  <Users size={16} className="inline mr-2" />
                  Tickets
                </label>
                <div className="flex items-center justify-between border-2 border-slate-300 rounded-xl p-3">
                  <button
                    onClick={() => setNumberOfTickets(Math.max(1, numberOfTickets - 1))}
                    className="w-10 h-10 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-xl transition"
                  >
                    -
                  </button>
                  <span className="text-xl font-bold">{numberOfTickets}</span>
                  <button
                    onClick={() => setNumberOfTickets(numberOfTickets + 1)}
                    className="w-10 h-10 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-xl transition"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Total Price */}
              {selectedDate && selectedTimeSlot && hasValidPrice && (
                <div className="mb-6 p-4 bg-slate-50 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-600">{formattedMinPrice} × {numberOfTickets} ticket{numberOfTickets > 1 ? 's' : ''}</span>
                    <span className="font-bold">€{(minPrice * numberOfTickets).toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Book Button */}
              <button
                onClick={handleBookNow}
                disabled={!selectedDate || !selectedTimeSlot || !hasValidPrice}
                className="w-full py-4 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition shadow-lg shadow-primary-600/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {!hasValidPrice
                  ? 'Price unavailable'
                  : !selectedDate
                  ? 'Sélectionner une date'
                  : !selectedTimeSlot
                  ? 'Sélectionner une plage horaire'
                  : 'Réserver maintenant'}
              </button>

              <p className="text-center text-xs text-slate-500 mt-4">
                You won't be charged yet
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Footer */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-slate-200 p-4 shadow-lg z-50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-600">From</p>
            <p className="text-2xl font-bold">
              {hasValidPrice ? formattedMinPrice : 'Price unavailable'}
            </p>
          </div>
          <button 
            onClick={handleBookNow}
            disabled={!selectedDate || !selectedTimeSlot || !hasValidPrice}
            className="px-8 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition disabled:opacity-50"
          >
            {!hasValidPrice
              ? 'Price unavailable'
              : !selectedDate
              ? 'Sélectionner une date'
              : !selectedTimeSlot
              ? 'Sélectionner une plage horaire'
              : 'Réserver maintenant'}
          </button>
        </div>
      </div>

      {/* Mobile padding to prevent content being hidden by sticky footer */}
      <div className="lg:hidden h-20"></div>

      {/* Inquiry Modal */}
      {showInquiryModal && (
        <InquiryModal
          product={product}
          isOpen={showInquiryModal}
          onClose={() => setShowInquiryModal(false)}
          onSubmitted={() => {
            alert('Inquiry sent successfully!');
          }}
        />
      )}
    </div>
  );
};

export default ProductDetailPage;
