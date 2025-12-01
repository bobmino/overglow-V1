import axios from 'axios';

// Configuration de l'URL de base pour les requêtes API
// En développement, utilise le proxy de Vite
// En production, utilise VITE_API_URL depuis les variables d'environnement
const API_URL = import.meta.env.VITE_API_URL || '';

// Créer une instance axios avec l'URL de base
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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

// Intercepteur pour gérer les erreurs globales
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si erreur 401 (non autorisé), déconnecter l'utilisateur
    if (error.response?.status === 401) {
      localStorage.removeItem('userInfo');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

