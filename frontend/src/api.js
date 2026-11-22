import axios from 'axios';

const api = axios.create({
  // THE FIX: This dynamically switches between local and cloud URLs!
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // THE FIX: Changed from 'Token' to 'Bearer'
      config.headers.Authorization = `Bearer ${token}`; 
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;