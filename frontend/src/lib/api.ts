import axios from 'axios';
import { auth } from './firebase'; 


const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- NEW: REQUEST INTERCEPTOR ---
// Before sending any request, grab the latest token from Firebase
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  
  if (user) {
    // This gets the JWT token (and refreshes it if expired)
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;