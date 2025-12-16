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
  return '';
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
  // Note: withCredentials n'est pas nécessaire car on utilise JWT dans Authorization header
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
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
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
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Log des erreurs pour debug (toujours actif)
    if (error.response) {
      // Le serveur a répondu avec un code d'erreur
      const contentType = error.response.headers['content-type'] || error.response.headers['Content-Type'] || 'unknown';
      console.error('❌ API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        contentType: contentType,
        data: error.response.data,
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
        fullURL: error.config?.baseURL ? `${error.config.baseURL}${error.config.url || ''}` : error.config?.url
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
              // Appel API pour refresh (sans utiliser l'intercepteur pour éviter boucle)
              const refreshResponse = await axios.post(`${API_URL}/api/auth/refresh`, {
                refreshToken
              }, {
                headers: {
                  'Content-Type': 'application/json',
                },
              });
              
              // Mettre à jour le token dans localStorage
              const updatedUser = {
                ...user,
                token: refreshResponse.data.token
              };
              localStorage.setItem('userInfo', JSON.stringify(updatedUser));
              
              // Réessayer la requête originale avec le nouveau token
              originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.token}`;
              return api(originalRequest);
            } catch (refreshError) {
              // Refresh failed, logout user
              console.error('Token refresh failed:', refreshError);
              localStorage.removeItem('userInfo');
              // Appeler logout endpoint si possible
              try {
                await axios.post(`${API_URL}/api/auth/logout`, { refreshToken }, {
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                  }
                });
              } catch {
                // Ignore logout errors
              }
              window.location.href = '/login';
              return Promise.reject(refreshError);
            }
          }
        } catch (parseError) {
          console.error('Error parsing userInfo:', parseError);
        }
      }
      
      // Si pas de refresh token ou refresh échoué, déconnecter
      localStorage.removeItem('userInfo');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;

