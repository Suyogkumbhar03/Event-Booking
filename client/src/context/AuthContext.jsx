import React, { createContext, useState, useEffect } from 'react';
import api from '../utils/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userInfo = localStorage.getItem('userInfo');
        const token = localStorage.getItem('token');
        if (userInfo && token) {
            try { setUser(JSON.parse(userInfo)); } catch (e) { /* ignore */ }
        }
        setLoading(false);
    }, []);

    const register = async (name, email, password) => {
        const { data } = await api.post('auth/register', { name, email, password });
        if (data.token) {
            const userData = { _id: data._id, name: data.name, email: data.email, role: data.role };
            setUser(userData);
            localStorage.setItem('userInfo', JSON.stringify(userData));
            localStorage.setItem('token', data.token);
        }
        return data;
    };

    const login = async (email, password) => {
        const { data } = await api.post('auth/login', { email, password });
        if (data.token) {
            const userData = { _id: data._id, name: data.name, email: data.email, role: data.role };
            setUser(userData);
            localStorage.setItem('userInfo', JSON.stringify(userData));
            localStorage.setItem('token', data.token);
        }
        return data;
    };

    const verifyPassword = async (email, password) => {
        const { data } = await api.post('auth/verify-password', { email, password });
        return data;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('userInfo');
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value={{ user, login, register, verifyPassword, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
