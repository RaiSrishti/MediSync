import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Token storage utilities
const getStoredTokens = () => ({
  accessToken: sessionStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken')
});

const setStoredTokens = (accessToken, refreshToken) => {
  sessionStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
};

const clearStoredTokens = () => {
  sessionStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true, // Keep this for any working cookies as fallback
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth header to all requests
api.interceptors.request.use((config) => {
  const { accessToken } = getStoredTokens();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Request interceptor to handle automatic token refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Don't retry refresh token requests or if already retried
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/refresh-token')) {
      
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        const { refreshToken } = getStoredTokens();
        if (!refreshToken) throw new Error('No refresh token');

        // Attempt to refresh the token - send refresh token in request body
        const response = await api.post('/auth/refresh-token', { refreshToken });
        
        // Store new tokens if provided in response
        if (response.data.tokens) {
          setStoredTokens(response.data.tokens.accessToken, response.data.tokens.refreshToken);
        }
        
        processQueue(null);
        isRefreshing = false;
        
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        clearStoredTokens();
        
        // Refresh failed, clear any stored auth state and redirect to login
        // Don't redirect if we're already on auth page or if this is the initial auth check
        if (!window.location.pathname.includes('/auth') && !originalRequest.url.includes('/auth/me')) {
          window.location.href = '/auth';
        }
        return Promise.reject(refreshError);
      }
    }
    
    // Log other errors
    if (error.response?.status === 403) {
      // Optionally handle 403 errors here (e.g., show a message)
    }
    
    return Promise.reject(error);
  }
);

export { api, API_BASE_URL, setStoredTokens, clearStoredTokens };
export default api;
