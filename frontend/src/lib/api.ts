import axios from 'axios';
import { auth } from './firebase'; 

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- ADD THIS INTERCEPTOR ---
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  
  if (user) {
    try {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    } catch (e) {
      console.error("Error fetching token:", e);
    }
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;