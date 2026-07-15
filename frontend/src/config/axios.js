import axios from 'axios';

const PRODUCTION_API_URL = 'https://overglow-backend.vercel.app';
const LOCAL_API_URL = 'http://127.0.0.1:5001';

const resolveBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, '');
  }
  if (import.meta.env.DEV) {
    return LOCAL_API_URL;
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host.includes('vercel.app') || (host !== 'localhost' && host !== '127.0.0.1')) {
      return PRODUCTION_API_URL;
    }
  }
  return LOCAL_API_URL;
};

const instance = axios.create({
  baseURL: resolveBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('userInfo');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const saveStoredUser = (user) => {
  localStorage.setItem('userInfo', JSON.stringify(user));
};

// ─── Intercepteur requête : URL production + Bearer token ─────────────────────
instance.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
      config.baseURL = PRODUCTION_API_URL;
    }

    const user = getStoredUser();
    if (user?.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }

    // Pass UI language so APIs can localize product/editorial content
    try {
      const lng =
        localStorage.getItem('i18nextLng') ||
        (typeof navigator !== 'undefined' ? navigator.language : 'fr');
      const short = String(lng).slice(0, 2).toLowerCase();
      config.headers['Accept-Language'] = short;
      config.params = { ...(config.params || {}), lang: short };
    } catch {
      /* ignore */
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Intercepteur réponse : refresh automatique sur 401 ─────────────────────
let isRefreshing = false;
let failedQueue = [];
let last429At = 0;

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
};

const isAuthEndpoint = (url = '') =>
  url.includes('/api/auth/login') ||
  url.includes('/api/auth/register') ||
  url.includes('/api/auth/refresh');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // Soft backoff on rate limit — avoid amplifying storms
    if (status === 429 && originalRequest && !originalRequest._retry429) {
      originalRequest._retry429 = true;
      const now = Date.now();
      const waitMs = Math.max(
        1500,
        Number(error.response?.headers?.['retry-after'] || 2) * 1000,
        2000 - (now - last429At)
      );
      last429At = now;
      await sleep(Math.min(waitMs, 8000));
      return instance(originalRequest);
    }

    if (
      !originalRequest ||
      status !== 401 ||
      originalRequest._retry ||
      isAuthEndpoint(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return instance(originalRequest);
      });
    }

    isRefreshing = true;

    try {
      const user = getStoredUser();
      const refreshToken = user?.refreshToken;

      if (!user || !refreshToken) {
        throw new Error('Session expirée — refresh token manquant');
      }

      const baseURL = (instance.defaults.baseURL || resolveBaseURL()).replace(/\/$/, '');
      const { data } = await axios.post(
        `${baseURL}/api/auth/refresh`,
        { refreshToken },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const newToken = data?.token;
      if (!newToken) {
        throw new Error('Réponse refresh invalide — token absent');
      }

      const updatedUser = {
        ...user,
        token: newToken,
        refreshToken: data.refreshToken || user.refreshToken,
      };
      saveStoredUser(updatedUser);
      window.dispatchEvent(new CustomEvent('tokenRefreshed', { detail: updatedUser }));

      processQueue(null, newToken);

      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return instance(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      localStorage.removeItem('userInfo');

      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default instance;
