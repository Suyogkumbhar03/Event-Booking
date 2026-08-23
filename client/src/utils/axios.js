import axios from 'axios';

const getBaseURL = () => {
    let url = import.meta.env.VITE_API_BASE_URL;
    if (url) {
        url = url.trim().replace(/\/+$/, '');
        if (!url.endsWith('/api')) {
            url = `${url}/api`;
        }
        return url;
    }
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        return 'https://event-booking-pjit.onrender.com/api';
    }
    return 'http://localhost:5000/api';
};

const API_BASE_URL = getBaseURL();

const api = axios.create({
    baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
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
            if (msg.includes('user account not found') || msg.includes('user not found') || msg.includes('invalid or expired')) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
        return Promise.reject(error);
    }
);

export default api;
