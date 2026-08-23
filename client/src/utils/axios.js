import axios from 'axios';

const getBaseURL = () => {
    let base = import.meta.env.VITE_API_BASE_URL;
    if (base) {
        base = base.trim().replace(/\/+$/, '').replace(/\/api$/, '');
        return `${base}/api`;
    }
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        return 'https://event-booking-pjit.onrender.com/api';
    }
    return 'http://localhost:5000/api';
};

const api = axios.create({
    baseURL: getBaseURL(),
});

api.interceptors.request.use((config) => {
    // Strip a leading /api segment if present to avoid /api/api/ duplication,
    // since baseURL already includes /api
    if (config.url) {
        // Strip duplicate /api prefix first, then remove leading slash.
        // Axios treats a leading '/' as origin-relative (drops baseURL path),
        // causing /api/ to be lost. Making paths relative fixes this.
        config.url = config.url
            .replace(/^\/api\//, '/')   // /api/auth/... → /auth/...
            .replace(/^\/api$/, '/')    // /api → /
            .replace(/^\//, '');        // /auth/... → auth/... (relative to baseURL)
    }
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            const msg = error.response.data?.message || '';
            if (
                msg.includes('user account not found') ||
                msg.includes('user not found') ||
                msg.includes('invalid or expired')
            ) {
                localStorage.removeItem('token');
                localStorage.removeItem('userInfo');
            }
        }
        return Promise.reject(error);
    }
);

export default api;
