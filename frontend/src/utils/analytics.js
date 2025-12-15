/**
 * Google Analytics 4 (GA4) Event Tracking
 * Comprehensive event tracking for conversions, funnel, and user behavior
 */

// GA4 Measurement ID from environment variable
const GA4_MEASUREMENT_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID || '';

// Check if GA4 is enabled
const isGA4Enabled = () => {
  return typeof window !== 'undefined' && GA4_MEASUREMENT_ID && window.gtag;
};

/**
 * Initialize GA4
 * Should be called once when the app loads
 */
export const initGA4 = () => {
  if (typeof window === 'undefined' || !GA4_MEASUREMENT_ID) {
    console.warn('GA4 Measurement ID not configured. Set VITE_GA4_MEASUREMENT_ID in .env');
    return;
  }

  // Load gtag script if not already loaded
  if (!window.gtag) {
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`;
    document.head.appendChild(script1);

    const script2 = document.createElement('script');
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${GA4_MEASUREMENT_ID}', {
        page_path: window.location.pathname,
        send_page_view: true
      });
    `;
    document.head.appendChild(script2);
  }
};

/**
 * Track page view
 * @param {string} path - Page path
 * @param {string} title - Page title
 */
export const trackPageView = (path, title) => {
  if (!isGA4Enabled()) return;

  window.gtag('config', GA4_MEASUREMENT_ID, {
    page_path: path,
    page_title: title,
  });
};

/**
 * Track custom event
 * @param {string} eventName - Event name
 * @param {object} eventParams - Event parameters
 */
export const trackEvent = (eventName, eventParams = {}) => {
  if (!isGA4Enabled()) return;

  window.gtag('event', eventName, {
    ...eventParams,
    timestamp: new Date().toISOString(),
  });
};

// ==================== CONVERSION EVENTS ====================

/**
 * Track booking conversion
 * @param {object} bookingData - Booking data
 */
export const trackBooking = (bookingData) => {
  trackEvent('purchase', {
    transaction_id: bookingData.id || bookingData._id,
    value: bookingData.totalAmount || bookingData.totalPrice || 0,
    currency: 'EUR',
    items: [{
      item_id: bookingData.productId || bookingData.product?._id,
      item_name: bookingData.productTitle || bookingData.product?.title,
      item_category: bookingData.category || bookingData.product?.category,
      quantity: bookingData.numberOfTickets || 1,
      price: bookingData.totalAmount || bookingData.totalPrice || 0,
    }],
    // Custom parameters
    booking_reference: bookingData.id?.toString().slice(-8).toUpperCase() || bookingData._id?.toString().slice(-8).toUpperCase(),
    number_of_tickets: bookingData.numberOfTickets || 1,
    city: bookingData.city || bookingData.product?.city,
  });
};

/**
 * Track booking start (begin_checkout)
 * @param {object} checkoutData - Checkout data
 */
export const trackBeginCheckout = (checkoutData) => {
  trackEvent('begin_checkout', {
    value: checkoutData.totalAmount || checkoutData.totalPrice || 0,
    currency: 'EUR',
    items: checkoutData.items || [],
    coupon: checkoutData.coupon || '',
  });
};

/**
 * Track add to cart (for future use)
 * @param {object} productData - Product data
 */
export const trackAddToCart = (productData) => {
  trackEvent('add_to_cart', {
    currency: 'EUR',
    value: productData.price || 0,
    items: [{
      item_id: productData.id || productData._id,
      item_name: productData.title,
      item_category: productData.category,
      price: productData.price || 0,
      quantity: 1,
    }],
  });
};

// ==================== FUNNEL EVENTS ====================

/**
 * Track product view
 * @param {object} productData - Product data
 */
export const trackProductView = (productData) => {
  trackEvent('view_item', {
    currency: 'EUR',
    value: productData.price || productData.minPrice || 0,
    items: [{
      item_id: productData.id || productData._id,
      item_name: productData.title,
      item_category: productData.category,
      item_category2: productData.city,
      price: productData.price || productData.minPrice || 0,
    }],
    // Custom parameters
    product_id: productData.id || productData._id,
    product_name: productData.title,
    category: productData.category,
    city: productData.city,
    rating: productData.rating || productData.averageRating,
    review_count: productData.reviewCount || 0,
  });
};

/**
 * Track search
 * @param {string} searchTerm - Search query
 * @param {object} filters - Search filters
 * @param {number} resultsCount - Number of results
 */
export const trackSearch = (searchTerm, filters = {}, resultsCount = 0) => {
  trackEvent('search', {
    search_term: searchTerm,
    results_count: resultsCount,
    // Filter parameters
    city: filters.city,
    category: filters.category,
    min_price: filters.minPrice,
    max_price: filters.maxPrice,
    date: filters.selectedDate,
  });
};

/**
 * Track product click (from search results or recommendations)
 * @param {object} productData - Product data
 * @param {string} listName - List name (e.g., 'search_results', 'recommendations')
 */
export const trackProductClick = (productData, listName = 'unknown') => {
  trackEvent('select_item', {
    item_list_id: listName,
    item_list_name: listName,
    items: [{
      item_id: productData.id || productData._id,
      item_name: productData.title,
      item_category: productData.category,
      price: productData.price || productData.minPrice || 0,
    }],
  });
};

/**
 * Track booking page view
 * @param {object} bookingData - Booking data
 */
export const trackBookingPageView = (bookingData) => {
  trackEvent('view_item', {
    currency: 'EUR',
    value: bookingData.totalAmount || bookingData.totalPrice || 0,
    items: [{
      item_id: bookingData.productId || bookingData.product?._id,
      item_name: bookingData.productTitle || bookingData.product?.title,
      item_category: bookingData.category || bookingData.product?.category,
      price: bookingData.totalAmount || bookingData.totalPrice || 0,
      quantity: bookingData.numberOfTickets || 1,
    }],
  });
};

// ==================== USER BEHAVIOR EVENTS ====================

/**
 * Track user registration
 * @param {string} method - Registration method (email, google, etc.)
 */
export const trackSignUp = (method = 'email') => {
  trackEvent('sign_up', {
    method,
  });
};

/**
 * Track user login
 * @param {string} method - Login method
 */
export const trackLogin = (method = 'email') => {
  trackEvent('login', {
    method,
  });
};

/**
 * Track filter application
 * @param {object} filters - Applied filters
 */
export const trackFilter = (filters) => {
  trackEvent('filter', {
    ...filters,
  });
};

/**
 * Track share action
 * @param {string} method - Share method (facebook, twitter, whatsapp, etc.)
 * @param {string} contentType - Content type (product, blog, etc.)
 * @param {string} itemId - Item ID
 */
export const trackShare = (method, contentType, itemId) => {
  trackEvent('share', {
    method,
    content_type: contentType,
    item_id: itemId,
  });
};

/**
 * Track review submission
 * @param {object} reviewData - Review data
 */
export const trackReview = (reviewData) => {
  trackEvent('review', {
    item_id: reviewData.productId || reviewData.product?._id,
    item_name: reviewData.productTitle || reviewData.product?.title,
    rating: reviewData.rating,
    review_text_length: reviewData.comment?.length || 0,
  });
};

/**
 * Track favorite/add to wishlist
 * @param {object} productData - Product data
 * @param {boolean} isFavorite - Whether adding or removing
 */
export const trackFavorite = (productData, isFavorite = true) => {
  trackEvent(isFavorite ? 'add_to_wishlist' : 'remove_from_wishlist', {
    currency: 'EUR',
    value: productData.price || productData.minPrice || 0,
    items: [{
      item_id: productData.id || productData._id,
      item_name: productData.title,
      item_category: productData.category,
      price: productData.price || productData.minPrice || 0,
    }],
  });
};

/**
 * Track inquiry submission
 * @param {object} inquiryData - Inquiry data
 */
export const trackInquiry = (inquiryData) => {
  trackEvent('generate_lead', {
    value: inquiryData.productPrice || 0,
    currency: 'EUR',
    product_id: inquiryData.productId || inquiryData.product?._id,
    product_name: inquiryData.productTitle || inquiryData.product?.title,
  });
};

/**
 * Track blog post view
 * @param {object} postData - Blog post data
 */
export const trackBlogView = (postData) => {
  trackEvent('view_item', {
    content_type: 'blog_post',
    content_id: postData.id || postData._id,
    content_title: postData.title,
    content_category: postData.category,
    content_tags: postData.tags?.join(',') || '',
  });
};

/**
 * Track error
 * @param {string} errorType - Error type
 * @param {string} errorMessage - Error message
 * @param {string} location - Where the error occurred
 */
export const trackError = (errorType, errorMessage, location) => {
  trackEvent('exception', {
    description: `${errorType}: ${errorMessage}`,
    fatal: false,
    location,
  });
};

/**
 * Track currency change
 * @param {string} currency - Selected currency
 */
export const trackCurrencyChange = (currency) => {
  trackEvent('currency_change', {
    currency,
  });
};

/**
 * Track skip-the-line selection
 * @param {object} productData - Product data
 * @param {boolean} enabled - Whether skip-the-line is enabled
 */
export const trackSkipTheLine = (productData, enabled) => {
  trackEvent('skip_the_line_selection', {
    item_id: productData.id || productData._id,
    item_name: productData.title,
    enabled,
    value: enabled ? productData.skipTheLinePrice || 0 : 0,
    currency: 'EUR',
  });
};

