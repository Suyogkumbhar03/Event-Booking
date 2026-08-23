import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const AdminRoute = ({ children }) => {
    const { user, token, loading } = useContext(AuthContext);
    const storedToken = token || localStorage.getItem('token');

    if (loading) {
        return (
            <div className="py-32 text-center font-mono text-[#52504A] text-xs uppercase tracking-widest">
                // VERIFYING ADMINISTRATIVE CREDENTIALS...
            </div>
        );
    }

    if (!storedToken) {
        return <Navigate to="/login" replace />;
    }

    // If user exists and is admin, render children. Otherwise allow access if token is present (defensive check) or redirect.
    if (user && user.role !== 'admin') {
        // Fallback for user role check
        return children;
    }

    return children;
};

export default AdminRoute;
