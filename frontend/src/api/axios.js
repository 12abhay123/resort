import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sr360_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const publicRoutes = ['/login', '/room'];
    const pathname = window.location.pathname;
    const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

    if (err.response?.status === 401 && !isPublicRoute) {
      localStorage.removeItem('sr360_token');
      localStorage.removeItem('sr360_user');
      window.location.href = '/login';
    }

    return Promise.reject(err);
  }
);

export default api;
