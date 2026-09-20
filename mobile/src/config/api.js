import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

function resolveApiUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '');
  }

  const hostUri = Constants.expoConfig?.hostUri || Constants.linkingUri || '';
  const lanHost = hostUri.replace(/^https?:\/\//, '').split(':')[0];
  if (lanHost && lanHost !== 'localhost' && lanHost !== '127.0.0.1') {
    return `http://${lanHost}:5000`;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000';
  }

  return 'http://localhost:5000';
}

export const API_BASE_URL = resolveApiUrl();

let onUnauthorized = null;
export function setOnUnauthorized(handler) {
  onUnauthorized = handler;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const userStr = await AsyncStorage.getItem('user');
  const selectedHostelId = await AsyncStorage.getItem('selectedHostelId');
  const url = config.url || '';
  const exclude = ['/api/hostels', '/api/users', '/api/auth'];
  const shouldExclude = exclude.some((p) => url.includes(p));

  if (userStr && selectedHostelId && !shouldExclude) {
    try {
      const user = JSON.parse(userStr);
      if (user.role === 'super_admin') {
        config.params = { ...config.params, hostel_id: selectedHostelId };
      }
    } catch (_) {}
  }

  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const url = error.config?.url || '';
    const isAuthCall = url.includes('/api/auth/login') || url.includes('/forgot-password') || url.includes('/reset-password');
    if (error.response?.status === 401 && !isAuthCall) {
      await AsyncStorage.multiRemove(['token', 'user', 'selectedHostelId']);
      onUnauthorized?.();
    }
    return Promise.reject(error);
  }
);

export default api;
