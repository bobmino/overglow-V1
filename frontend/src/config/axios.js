import axios from 'axios';

const instance = axios.create({
  // Utilisation stricte de la variable d'environnement définie
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:5001',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default instance;