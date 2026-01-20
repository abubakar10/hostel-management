// API Configuration
// This file centralizes the API base URL configuration

const getApiBaseUrl = () => {
  // In production (Netlify), use the Vercel backend URL from environment variable
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_API_URL || 'https://your-vercel-backend.vercel.app';
  }
  
  // In development, use the proxy (which points to localhost:5000)
  return '';
};

export const API_BASE_URL = getApiBaseUrl();

// Create axios instance with base URL
import axios from 'axios';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle both 401 (Unauthorized) and 403 (Forbidden) - both indicate auth issues
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Invalid or expired token - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

