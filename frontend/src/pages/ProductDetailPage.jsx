import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../config/axios';
import { useCurrency } from '../context/CurrencyContext';
import { trackProductView, trackEvent } from '../utils/analytics';
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
import ShareButtons from '../components/ShareButtons';
import TrustBar from '../components/TrustBar';
import { formatImageUrl } from '../utils/formatImage';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';

const ProductDetailPage = () => {
  const { t } = useTranslation();
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
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [productBadges, setProductBadges] = useState([]);
  const [operatorBadges, setOperatorBadges] = useState([]);
  const { formatPrice } = useCurrency();
  const { addToCart, setIsCartOpen } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await api.get(`/api/products/${id}`);
        setProduct(data);
        setAvailableSchedules(Array.isArray(data?.schedules) ? data.schedules : []);
        
        // Add Schema.org structured data
        if (data && typeof window !== 'undefined') {
          const schema = {
            "@context": "https://schema.org",
            "@type": "Product",
            "name": data.title,
            "description": data.description,
            "image": Array.isArray(data.images) && data.images.length > 0 ? data.images : [],
            "offers": {
              "@type": "Offer",
              "price": data.price || 0,
              "priceCurrency": "MAD",
              "availability": "https://schema.org/InStock",
              "url": `${window.location.origin}/products/${data._id}`
            },
            "aggregateRating": data.metrics?.averageRating ? {
              "@type": "AggregateRating",
              "ratingValue": data.metrics.averageRating,
              "reviewCount": data.metrics.reviewCount || 0
            } : undefined,
            "brand": data.operator?.companyName ? {
              "@type": "Organization",
              "name": data.operator.companyName
            } : undefined
          };
          
          // Remove undefined fields
          Object.keys(schema).forEach(key => schema[key] === undefined && delete schema[key]);
          
          // Remove existing schema script if any
          const existingScript = document.getElementById('product-schema');
          if (existingScript) existingScript.remove();
          
          // Add new schema script
          const script = document.createElement('script');
          script.id = 'product-schema';
          script.type = 'application/ld+json';
          script.textContent = JSON.stringify(schema);
          document.head.appendChild(script);
        }
        
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

  // Track product view when product is loaded
  useEffect(() => {
    if (product) {
      trackProductView({
        id: product._id,
        _id: product._id,
        title: product.title,
        category: product.category,
        city: product.city,
        price: getMinPrice(),
        minPrice: getMinPrice(),
        rating: product.averageRating,
        reviewCount: product.reviews?.length || 0,
      });
    }
  }, [product]);

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
      alert(t('product.select_date_error', 'Veuillez sélectionner une date'));
      return;
    }
    if (!selectedTimeSlot) {
      alert(t('product.select_time_error', 'Veuillez sélectionner une plage horaire'));
      return;
    }
    
    // Track add_to_cart equivalent (user starting booking process)
    trackEvent('add_to_cart', {
      currency: 'EUR',
      value: getMinPrice() || product.price || 0,
      items: [{
        item_id: product._id,
        item_name: product.title,
        item_category: product.category,
        price: getMinPrice() || product.price || 0,
        quantity: numberOfTickets || 1,
      }],
    });
    
    navigate('/booking', {
      state: {
        product,
        date: selectedDate,
        timeSlot: selectedTimeSlot,
        tickets: numberOfTickets,
        skipTheLine: product?.skipTheLine || null
      }
    });
  };

  const handleAddToCart = () => {
    if (!selectedDate) {
      alert(t('product.select_date_error', 'Veuillez sélectionner une date'));
      return;
    }
    if (!selectedTimeSlot) {
      alert(t('product.select_time_error', 'Veuillez sélectionner une plage horaire'));
      return;
    }

    const dateStr = selectedDate instanceof Date ? selectedDate.toISOString() : String(selectedDate);
    const timeStr = selectedTimeSlot.startTime || selectedTimeSlot.time || String(selectedTimeSlot);

    const matchingSchedule = availableSchedules.find(s => {
      const sDate = new Date(s.date);
      sDate.setHours(0, 0, 0, 0);
      const selDate = new Date(selectedDate);
      selDate.setHours(0, 0, 0, 0);
      return sDate.getTime() === selDate.getTime() && s.time === timeStr;
    });

    const scheduleId = matchingSchedule?._id || `virtual_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    const newItem = {
      product,
      schedule: {
        _id: scheduleId,
        date: dateStr,
        time: timeStr,
        endTime: selectedTimeSlot.endTime || '',
        price: matchingSchedule?.price || selectedTimeSlot.price || getMinPrice() || product.price || 0,
      },
      numberOfTickets,
      skipTheLine: product?.skipTheLine?.enabled || false,
    };

    addToCart(newItem);
    setIsCartOpen(true);
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
          description: "Commencez votre journée avec les vues époustouflantes d'Agadir. Parfait pour vos photos !" 
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
  const currentUrl = typeof window !== 'undefined' ? window.location.href : `https://overglow-backend.vercel.app/products/${product?._id || ''}`;
  const normalizedImages = Array.isArray(product?.images) ? product.images.map(formatImageUrl).filter(Boolean) : [];
  const ogImage = normalizedImages[0] || 'https://overglow-v1-3jqp.vercel.app/vite.svg';
  const metaTitle = `${product?.title || 'Experience'} a ${product?.city || 'Maroc'} | Overglow`;
  const shortDescription = (product?.description || 'Experience locale verifiee, paiement securise et support 24/7 sur Overglow.')
    .trim()
    .slice(0, 155);

  return (
    <div className="bg-slate-50">
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={shortDescription} />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={shortDescription} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:secure_url" content={ogImage} />
        <meta property="og:image:alt" content={product?.title || 'Experience Overglow'} />
        <meta property="og:url" content={currentUrl} />
        <meta property="og:site_name" content="Overglow" />
        <meta property="og:locale" content="fr_FR" />
        <meta property="og:type" content="product" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={shortDescription} />
        <meta name="twitter:image" content={ogImage} />
        <link rel="canonical" href={currentUrl} />
      </Helmet>
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="mb-5">
          <TrustBar compact />
        </div>
        {product?.operator?.isClaimed === false && (
          <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
            <p className="text-sm font-medium text-slate-800 flex items-center gap-2">
              <Shield size={18} className="text-slate-600" />
              {t('product.claim_question', "Vous êtes l'organisateur de cette activité ?")}
            </p>
            <Link
              to={`/partners/signup?activity=${encodeURIComponent(product?.title || '')}`}
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
            >
              {t('product.claim_action', "Prenez le contrôle de votre fiche")}
            </Link>
          </div>
        )}
        {/* Breadcrumb */}
        <nav className="text-sm text-slate-600 mb-4">
          <Link to="/" className="hover:text-primary-600">{t('common.home', 'Accueil')}</Link>
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
            <ImageGallery images={normalizedImages} />
 
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
              
              <div className="flex items-center gap-2 mb-4 text-emerald-600 bg-emerald-50 w-fit px-3 py-1 rounded-full text-sm font-semibold">
                <CheckCircle size={16} />
                {t('product.verified_by', 'Vérifié par Overglow')}
              </div>
              
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 flex-1">
                  {product.title}
                </h1>
                <div className="flex items-center gap-2">
                  <ShareButtons product={product} />
                  <FavoriteButton productId={product._id} size={28} />
                </div>
              </div>
 
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <Star size={18} className="text-yellow-500 fill-yellow-500 mr-1" />
                    <span className="font-bold">4.8</span>
                    <span className="text-slate-500 ml-1">({product.reviews?.length || 0} {t('product.reviews_suffix', 'avis')})</span>
                  </div>
                  <div className="flex items-center text-slate-600">
                    <Clock size={16} className="mr-1" />
                    <span>{product.duration || t('product.duration_fallback', '3-4 heures')}</span>
                  </div>
                </div>
              </div>
 
              {/* Urgency Message */}
              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-700">
                  <span className="font-bold">{t('product.popular_badge', 'Populaire :')}</span> {t('product.booked_urgency', 'Réservé 127 fois ces dernières 24 heures')}
                </p>
              </div>
            </div>
 
            {/* Description */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-2xl font-bold mb-4">{t('product.about', 'À propos de cette expérience')}</h2>
              <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>

            {/* What's Included */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-2xl font-bold mb-4">{t('product.included', 'Ce qui est inclus')}</h2>
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
              <h2 className="text-2xl font-bold mb-4">{t('product.highlights', 'Points forts')}</h2>
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
              <h2 className="text-2xl font-bold mb-4">{t('product.itinerary', 'Itinéraire')}</h2>
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
              <h2 className="text-2xl font-bold mb-4">{t('product.guarantees_title', 'Garanties et Certifications')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                  <Shield size={24} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-green-900 mb-1">{t('product.guarantee_low_price', 'Garantie Prix Bas')}</h3>
                    <p className="text-sm text-green-700">{t('product.guarantee_low_price_desc', 'Meilleur prix garanti ou remboursement de la différence')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <CheckCircle size={24} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-blue-900 mb-1">{t('product.guarantee_free_cancel', 'Annulation Gratuite')}</h3>
                    <p className="text-sm text-blue-700">{t('product.guarantee_free_cancel_desc', "Annulez jusqu'à 24h avant pour un remboursement complet")}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <Award size={24} className="text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-purple-900 mb-1">{t('product.guarantee_verified_operator', 'Opérateur Vérifié')}</h3>
                    <p className="text-sm text-purple-700">{t('product.guarantee_verified_operator_desc', 'Tous nos opérateurs sont vérifiés et certifiés')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <TrendingUp size={24} className="text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-orange-900 mb-1">{t('product.guarantee_support', 'Support 24/7')}</h3>
                    <p className="text-sm text-orange-700">{t('product.guarantee_support_desc', 'Assistance client disponible à tout moment')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cancellation Policy */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-2xl font-bold mb-4">{t('product.cancellation_policy', "Politique d'Annulation")}</h2>
              <CancellationPolicy 
                policy={product.cancellationPolicy}
              />
            </div>

            {/* FAQ */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-2xl font-bold mb-4">{t('product.faq', 'Foire aux questions')}</h2>
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
                <h2 className="text-2xl font-bold mb-4">{t('product.inquiry_title', 'Questions ou validation requise')}</h2>
                <p className="text-slate-700 mb-4">
                  {t('product.inquiry_required', 'Ce produit nécessite une inquiry')} {product.inquiryType === 'manual' ? '(question/réponse)' : '(validation automatique)'}.
                </p>
                <button
                  onClick={() => setShowInquiryModal(true)}
                  className="px-6 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition"
                >
                  {t('product.send_inquiry', 'Envoyer une inquiry')}
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
                <h2 className="text-2xl font-bold mb-6">{t('product.related_products', 'Produits similaires')}</h2>
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
          <div className="col-span-12 lg:col-span-4 hidden lg:block">
            <div className="sticky top-28 h-fit bg-white border border-slate-100 rounded-2xl p-3.5 shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
              {/* Cancellation Policy */}
              <div className="mb-2.5 p-2.5 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center text-green-700 mb-0.5">
                  <CheckCircle size={16} className="mr-2" />
                  <span className="font-bold text-xs">{t('product.free_cancellation', 'Annulation gratuite')}</span>
                </div>
                <p className="text-[11px] text-green-600 leading-tight">
                  {t('product.free_cancellation_desc', "Annulez jusqu'à 24h à l'avance pour un remboursement complet")}
                </p>
              </div>

              {/* Price Display */}
              <div className="mb-2.5">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">{t('product.starting_from', 'À partir de')}</p>
                {hasValidPrice ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900">{formattedMinPrice}</span>
                    <span className="text-[11px] text-slate-500">{t('product.price_per_ticket', 'par personne')}</span>
                  </div>
                ) : (
                  <p className="text-slate-500 text-xs">{t('product.price_unavailable_contact', 'Prix non disponible. Veuillez contacter le support.')}</p>
                )}
              </div>

              {/* Date Picker */}
              <div className="mb-2.5">
                <DatePicker 
                  onDateSelect={setSelectedDate}
                  selectedDate={selectedDate}
                />
              </div>

              {/* Time Slot Picker */}
              <div className="mb-2.5">
                <TimeSlotPicker
                  product={product}
                  selectedTimeSlot={selectedTimeSlot}
                  onTimeSlotSelect={setSelectedTimeSlot}
                  required={true}
                />
              </div>

              {/* Tickets Selector */}
              <div className="mb-2.5">
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                  <Users size={12} className="inline mr-1" />
                  {t('product.tickets_count', 'Billets')}
                </label>
                <div className="flex items-center justify-between border border-slate-300 rounded-xl p-1.5">
                  <button
                    onClick={() => setNumberOfTickets(Math.max(1, numberOfTickets - 1))}
                    className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-base transition flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="text-sm font-bold text-slate-800">{numberOfTickets}</span>
                  <button
                    onClick={() => setNumberOfTickets(numberOfTickets + 1)}
                    className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-base transition flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Total Price */}
              {selectedDate && selectedTimeSlot && hasValidPrice && (
                <div className="mb-2.5 p-2 bg-slate-50 rounded-xl border border-slate-150">
                  <div className="flex justify-between items-center mb-0.5 text-xs">
                    <span className="text-slate-600">
                      {formattedMinPrice} × {numberOfTickets} {numberOfTickets > 1 ? t('product.tickets', 'billets') : t('product.ticket', 'billet')}
                    </span>
                    <span className="font-bold text-slate-700">{formatPrice(minPrice * numberOfTickets, 'EUR')}</span>
                  </div>
                  {product?.skipTheLine?.enabled && product?.skipTheLine?.additionalPrice > 0 && (
                    <div className="flex justify-between items-center mb-1 text-[11px]">
                      <span className="text-slate-500 flex items-center gap-1">
                        <span>⚡</span>
                        {t('product.skip_line', 'Coupe-file')}
                      </span>
                      <span className="font-bold text-slate-700">{formatPrice(product.skipTheLine.additionalPrice * numberOfTickets, 'EUR')}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-1.5 border-t border-slate-200">
                    <span className="font-bold text-xs text-slate-800">{t('cart.total', 'Total')}</span>
                    <span className="font-black text-sm text-emerald-600">
                      {formatPrice(
                        (minPrice * numberOfTickets) + 
                        (product?.skipTheLine?.enabled && product?.skipTheLine?.additionalPrice > 0 
                          ? product.skipTheLine.additionalPrice * numberOfTickets 
                          : 0),
                        'EUR'
                      )}
                    </span>
                  </div>
                </div>
              )}

              {/* Book Button */}
              <button
                onClick={handleBookNow}
                disabled={!selectedDate || !selectedTimeSlot || !hasValidPrice}
                className="w-full py-2 bg-emerald-600 text-white font-bold text-sm rounded-xl hover:bg-emerald-700 transition-all duration-300 shadow-md shadow-emerald-600/10 hover:shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {!hasValidPrice
                  ? t('product.price_unavailable', 'Prix non disponible')
                  : !selectedDate
                  ? t('product.select_date', 'Sélectionner une date')
                  : !selectedTimeSlot
                  ? t('product.select_time', 'Sélectionner une plage horaire')
                  : t('product.book_now', 'Réserver maintenant')}
              </button>

              <button
                onClick={handleAddToCart}
                disabled={!selectedDate || !selectedTimeSlot || !hasValidPrice}
                className="w-full mt-2 py-2 border border-emerald-600 text-emerald-700 font-bold rounded-xl hover:bg-emerald-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 text-sm"
              >
                <span>🛒</span>
                {t('product.add_to_cart', 'Ajouter au panier')}
              </button>

              <p className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 mt-3 font-semibold">
                <Shield size={12} className="text-emerald-500" />
                {t('product.secure_payment', 'Paiement sécurisé et crypté')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Footer */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-[0_-8px_30px_rgb(0,0,0,0.08)] z-40 flex justify-between items-center">
        <div>
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{t('product.starting_from', 'À partir de')}</p>
          <p className="text-xl font-black text-slate-900">
            {hasValidPrice ? formattedMinPrice : t('product.price_unavailable', 'Prix non disponible')}
          </p>
        </div>
        <button
          onClick={() => setIsMobileDrawerOpen(true)}
          className="px-6 py-3 bg-emerald-600 text-white font-bold text-sm rounded-xl hover:bg-emerald-700 transition duration-300 shadow-md shadow-emerald-600/10"
        >
          {selectedDate && selectedTimeSlot 
            ? t('product.view_details', 'Modifier / Réserver')
            : t('product.select_date_btn', 'Sélectionner une date')
          }
        </button>
      </div>

      {/* Mobile Booking Drawer */}
      <AnimatePresence>
        {isMobileDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileDrawerOpen(false)}
              className="lg:hidden fixed inset-0 bg-black z-50"
            />
            {/* Drawer Content */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 max-h-[85vh] overflow-y-auto shadow-2xl p-6 border-t border-slate-100"
            >
              {/* Header of Drawer */}
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-lg text-slate-900">{t('product.booking_options', 'Options de réservation')}</h3>
                  <p className="text-xs text-slate-500">{product.title}</p>
                </div>
                <button
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-700 transition"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Booking Widget contents replicated here for Mobile */}
              <div className="space-y-4">
                {/* Cancellation Info */}
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center text-green-700 mb-1">
                    <CheckCircle size={16} className="mr-2" />
                    <span className="font-bold text-xs">{t('product.free_cancellation', 'Annulation gratuite')}</span>
                  </div>
                  <p className="text-xs text-green-600 leading-tight">
                    {t('product.free_cancellation_desc', "Annulez jusqu'à 24h à l'avance pour un remboursement complet")}
                  </p>
                </div>

                {/* Date Picker */}
                <div>
                  <DatePicker 
                    onDateSelect={setSelectedDate}
                    selectedDate={selectedDate}
                  />
                </div>

                {/* Time Slot Picker */}
                <div>
                  <TimeSlotPicker
                    product={product}
                    selectedTimeSlot={selectedTimeSlot}
                    onTimeSlotSelect={setSelectedTimeSlot}
                    required={true}
                  />
                </div>

                {/* Tickets Selector */}
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                    <Users size={12} className="inline mr-1" />
                    {t('product.tickets_count', 'Billets')}
                  </label>
                  <div className="flex items-center justify-between border border-slate-300 rounded-xl p-2">
                    <button
                      onClick={() => setNumberOfTickets(Math.max(1, numberOfTickets - 1))}
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-lg transition flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="text-base font-bold text-slate-800">{numberOfTickets}</span>
                    <button
                      onClick={() => setNumberOfTickets(numberOfTickets + 1)}
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-lg transition flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Total Price & Skip the line details */}
                {selectedDate && selectedTimeSlot && hasValidPrice && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-150">
                    <div className="flex justify-between items-center mb-1 text-xs">
                      <span className="text-slate-600">
                        {formattedMinPrice} × {numberOfTickets} {numberOfTickets > 1 ? t('product.tickets', 'billets') : t('product.ticket', 'billet')}
                      </span>
                      <span className="font-bold text-slate-700">{formatPrice(minPrice * numberOfTickets, 'EUR')}</span>
                    </div>
                    {product?.skipTheLine?.enabled && product?.skipTheLine?.additionalPrice > 0 && (
                      <div className="flex justify-between items-center mb-1.5 text-xs">
                        <span className="text-slate-500 flex items-center gap-1">
                          <span>⚡</span>
                          {t('product.skip_line', 'Coupe-file')}
                        </span>
                        <span className="font-bold text-slate-700">{formatPrice(product.skipTheLine.additionalPrice * numberOfTickets, 'EUR')}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                      <span className="font-bold text-xs text-slate-800">{t('cart.total', 'Total')}</span>
                      <span className="font-black text-sm text-emerald-600">
                        {formatPrice(
                          (minPrice * numberOfTickets) + 
                          (product?.skipTheLine?.enabled && product?.skipTheLine?.additionalPrice > 0 
                            ? product.skipTheLine.additionalPrice * numberOfTickets 
                            : 0),
                          'EUR'
                        )}
                      </span>
                    </div>
                  </div>
                )}

                {/* Bottom Actions inside Drawer */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => {
                      handleAddToCart();
                      setIsMobileDrawerOpen(false);
                    }}
                    disabled={!selectedDate || !selectedTimeSlot || !hasValidPrice}
                    className="py-3 border-2 border-emerald-600 text-emerald-700 font-bold rounded-xl hover:bg-emerald-50 transition disabled:opacity-50 text-sm flex items-center justify-center gap-1.5"
                  >
                    <span>🛒</span>
                    {t('product.add_to_cart', 'Ajouter au panier')}
                  </button>
                  <button
                    onClick={() => {
                      handleBookNow();
                      setIsMobileDrawerOpen(false);
                    }}
                    disabled={!selectedDate || !selectedTimeSlot || !hasValidPrice}
                    className="py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition disabled:opacity-50 shadow-lg shadow-emerald-600/20 text-sm"
                  >
                    {t('product.book_now', 'Réserver maintenant')}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile padding to prevent content being hidden by sticky footer */}
      <div className="lg:hidden h-28"></div>

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
