import axios from 'axios';

// Configuration de l'URL de base pour les requêtes API
// En développement, utilise le proxy de Vite (vide = utilise le proxy)
// En production, utilise VITE_API_URL ou l'URL du backend par défaut
const getApiUrl = () => {
  // Si VITE_API_URL est défini, l'utiliser
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // En production (Vercel), utiliser le même domaine (les routes /api sont gérées par Vercel)
  // Si le frontend et backend sont sur le même domaine Vercel, utiliser une URL relative
  if (import.meta.env.PROD || window.location.hostname.includes('vercel.app')) {
    // Si on est sur le même domaine que le backend, utiliser une URL relative
    // Sinon, utiliser l'URL absolue du backend
    const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
    if (currentHost.includes('overglow-v1') || currentHost.includes('overglow-frontend')) {
      // Frontend et backend sur le même domaine Vercel - utiliser URL relative
      return '';
    }
    // Backend séparé - utiliser URL absolue
    return 'https://overglow-backend.vercel.app';
  }
  
  // En développement, retourner vide pour utiliser le proxy Vite
  return '';
};

const API_URL = getApiUrl();

// Log pour debug (uniquement en développement)
if (import.meta.env.DEV) {
  console.log('🔧 API Configuration:', {
    baseURL: API_URL || 'Using Vite proxy',
    isProduction: import.meta.env.PROD,
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'N/A'
  });
}

// Créer une instance axios avec l'URL de base
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 secondes timeout
  // Note: withCredentials n'est pas nécessaire car on utilise JWT dans Authorization header
});

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
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Log des erreurs pour debug
    if (error.response) {
      // Le serveur a répondu avec un code d'erreur
      console.error('API Error Response:', {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url,
        baseURL: error.config?.baseURL
      });
    } else if (error.request) {
      // La requête a été faite mais aucune réponse n'a été reçue
      console.error('API Error Request:', {
        message: error.message,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        fullURL: error.config?.baseURL + error.config?.url
      });
    } else {
      // Erreur lors de la configuration de la requête
      console.error('API Error Config:', error.message);
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

