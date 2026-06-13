import axios from 'axios';

// Configuration de l'URL de base pour les requêtes API
// En développement, utilise le proxy de Vite (vide = utilise le proxy)
// En production, utilise VITE_API_URL ou l'URL du backend par défaut
const getApiUrl = () => {
  // Si VITE_API_URL est défini, l'utiliser
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // En production (Vercel), TOUJOURS utiliser l'URL absolue du backend séparé
  // Le frontend et le backend sont sur des domaines Vercel différents
  // Ne JAMAIS utiliser d'URL relative en production car cela cause des problèmes de routage
  const isProduction = import.meta.env.PROD || 
                       (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) ||
                       (typeof window !== 'undefined' && window.location.hostname !== 'localhost');
  
  if (isProduction) {
    // Utiliser l'URL absolue du backend séparé
    return 'https://overglow-backend.vercel.app';
  }
  
  // En développement, retourner vide pour utiliser le proxy Vite
  if (import.meta.env.DEV) {
    return '';
  }

  return '/api';
};

const API_URL = getApiUrl();

// Log pour debug (toujours actif pour troubleshooting)
console.log('🔧 API Configuration:', {
  baseURL: API_URL || 'Using Vite proxy',
  isProduction: import.meta.env.PROD,
  hostname: typeof window !== 'undefined' ? window.location.hostname : 'N/A',
  envPROD: import.meta.env.PROD,
  envDEV: import.meta.env.DEV,
  fullURL: API_URL ? `${API_URL}/api/auth/login` : 'relative'
});

// Créer une instance axios avec l'URL de base
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 secondes timeout
  withCredentials: true,
});

// Intercepteur pour forcer l'URL absolue en production
api.interceptors.request.use(
  (config) => {
    // En production, s'assurer que toutes les requêtes API utilisent l'URL absolue
    if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
      // Si baseURL n'est pas défini ou est vide, utiliser l'URL absolue du backend
      if (!config.baseURL || config.baseURL === '') {
        config.baseURL = 'https://overglow-backend.vercel.app';
      }
      // Si l'URL est relative et commence par /api, s'assurer qu'elle utilise baseURL
      if (config.url && config.url.startsWith('/api') && !config.url.startsWith('http')) {
        // L'URL relative sera automatiquement combinée avec baseURL par axios
        // Mais on s'assure que baseURL est bien défini
        if (!config.baseURL) {
          config.baseURL = 'https://overglow-backend.vercel.app';
        }
      }
    }
    
    // Log de la requête pour debugging (toujours actif)
    const fullURL = config.baseURL 
      ? (config.url?.startsWith('http') ? config.url : `${config.baseURL}${config.url || ''}`)
      : config.url;
    
    console.log('📤 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: fullURL,
      headers: config.headers
    });
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour ajouter le token d'authentification automatiquement
api.interceptors.request.use(
  (config) => {
    config.withCredentials = true;
    const userInfo = localStorage.getItem('userInfo');
    const explicitAuthHeader = Boolean(config.headers?.Authorization);
    if (userInfo && !explicitAuthHeader) {
      try {
        const user = JSON.parse(userInfo);
        if (user && user.token) {
          config.headers.Authorization = `Bearer ${user.token}`;
        }
      } catch (error) {
        console.error('Error parsing userInfo:', error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs globales et refresh tokens
api.interceptors.response.use(
  (response) => {
    // Log de la réponse pour debugging
    const contentType = response.headers['content-type'] || response.headers['Content-Type'] || 'unknown';
    console.log('📥 API Response:', {
      status: response.status,
      statusText: response.statusText,
      contentType: contentType,
      url: response.config?.url,
      baseURL: response.config?.baseURL,
      fullURL: response.config?.baseURL ? `${response.config.baseURL}${response.config.url || ''}` : response.config?.url,
      isJSON: contentType.includes('application/json'),
      isHTML: contentType.includes('text/html')
    });
    
    // Vérifier si la réponse est du HTML au lieu de JSON (problème de routage)
    if (contentType.includes('text/html') && response.config?.url?.includes('/api/')) {
      console.error('⚠️ WARNING: API endpoint returned HTML instead of JSON!', {
        url: response.config.url,
        baseURL: response.config.baseURL,
        fullURL: response.config.baseURL ? `${response.config.baseURL}${response.config.url}` : response.config.url,
        responsePreview: typeof response.data === 'string' ? response.data.substring(0, 200) : response.data
      });
    }
    
    // Handle backend silent failure envelope for booking/checkout flows only.
    const requestUrl = response.config?.url || '';
    const isBookingFlow = requestUrl.includes('/api/bookings') || requestUrl.includes('/api/orders');
    if (isBookingFlow && response?.data && response.data.success === false) {
      const politeMessage = response.data.message || 'Validation de la réservation en cours...';
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('app-toast', {
          detail: { type: 'info', message: politeMessage }
        }));
      }
      const wrappedError = new Error(politeMessage);
      wrappedError.response = response;
      wrappedError.__toastShown = true;
      return Promise.reject(wrappedError);
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Log des erreurs pour debug (toujours actif)
    if (error.response) {
      // Le serveur a répondu avec un code d'erreur
      const contentType = error.response.headers['content-type'] || error.response.headers['ContentType'] || 'unknown';
      console.error('❌ API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        contentType: contentType,
        data: JSON.stringify(error.response.data),
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        fullURL: error.config?.baseURL ? `${error.config.baseURL}${error.config.url || ''}` : error.config?.url,
        isHTML: contentType.includes('text/html')
      });
      
      // Si la réponse est du HTML, c'est un problème de routage
      if (contentType.includes('text/html') && error.config?.url?.includes('/api/')) {
        console.error('⚠️ CRITICAL: API endpoint returned HTML instead of JSON!', {
          url: error.config.url,
          baseURL: error.config.baseURL,
          fullURL: error.config.baseURL ? `${error.config.baseURL}${error.config.url}` : error.config.url,
          responsePreview: typeof error.response.data === 'string' ? error.response.data.substring(0, 500) : error.response.data
        });
      }
    } else if (error.request) {
      // La requête a été faite mais aucune réponse n'a été reçue
      console.error('❌ API Error Request:', {
        message: error.message,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        fullURL: error.config.baseURL ? `${error.config.baseURL}${error.config.url || ''}` : error.config?.url
      });
    } else {
      // Erreur lors de la configuration de la requête
      console.error('❌ API Error Config:', error.message);
    }
    
    // Si erreur 401 (non autorisé), essayer de refresh le token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        try {
          const user = JSON.parse(userInfo);
          const refreshToken = user.refreshToken;
          
          if (refreshToken) {
            try {
              console.log('🔄 Attempting token refresh...');
              // CORRECTION: Appel API pour refresh avec le token dans le body ET les cookies
              // Le backend accepte le refresh token soit dans le body, soit dans les cookies
              const refreshResponse = await axios.post(`${API_URL}/api/auth/refresh`, {
                refreshToken
              }, {
                headers: {
                  'Content-Type': 'application/json',
                },
                withCredentials: true,
              });
              
              console.log('✅ Token refresh successful');
              
              // Mettre à jour le token dans localStorage
              const updatedUser = {
                ...user,
                token: refreshResponse.data.token,
                refreshToken: refreshResponse.data.refreshToken || user.refreshToken
              };
              localStorage.setItem('userInfo', JSON.stringify(updatedUser));
              
              // Mettre à jour le contexte d'authentification si disponible
              if (window.dispatchEvent) {
                window.dispatchEvent(new CustomEvent('tokenRefreshed', { detail: updatedUser }));
              }
              
              // Réessayer la requête originale avec le nouveau token
              originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.token}`;
              return api(originalRequest);
            } catch (refreshError) {
              // Refresh failed
              console.error('❌ Token refresh failed:', refreshError.response?.data || refreshError.message);
              
              // Ne PAS rediriger vers login pendant le checkout - laisser l'utilisateur réessayer
              // Vérifier si on est sur une page critique (checkout, booking)
              const isCriticalPage = window.location.pathname.includes('/checkout') ||
                                     window.location.pathname.includes('/booking');
              
              if (!isCriticalPage) {
                localStorage.removeItem('userInfo');
                // Appeler logout endpoint si possible
                try {
                  await axios.post(`${API_URL}/api/auth/logout`, { refreshToken }, {
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${user.token}`
                    },
                    withCredentials: true,
                  });
                } catch {
                  // Ignore logout errors
                }
                window.location.href = '/login';
              }
              
              return Promise.reject(refreshError);
            }
          }
        } catch (parseError) {
          console.error('Error parsing userInfo:', parseError);
        }
      }
      
      // Si pas de refresh token ou refresh échoué, ne PAS rediriger sur les pages critiques
      const isCriticalPage = window.location.pathname.includes('/checkout') ||
                             window.location.pathname.includes('/booking');
      
      if (!isCriticalPage) {
        localStorage.removeItem('userInfo');
        window.location.href = '/login';
      }
    }

    if (!error?.__toastShown) {
      const backendMessage = error?.response?.data?.message;
      const fallbackMessage = backendMessage || 'Validation de la réservation en cours...';
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('app-toast', {
          detail: { type: 'error', message: fallbackMessage }
        }));
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
