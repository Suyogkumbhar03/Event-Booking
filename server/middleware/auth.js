const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token = req.headers.authorization;
    if (token && token.startsWith('Bearer')) {
        try {
            token = token.split(' ')[1];
            const secret = process.env.JWT_SECRET || 'eventora_jwt_secure_key_2026';
            const decoded = jwt.verify(token, secret);
            
            // 1. Try finding by ID
            let userDoc = null;
            if (decoded.id) {
                userDoc = await User.findById(decoded.id).select('-password');
            }

            // 2. Fallback: search by email if ID lookup fails or DB re-seeded
            if (!userDoc && decoded.email) {
                userDoc = await User.findOne({ email: decoded.email.toLowerCase().trim() }).select('-password');
            }

            if (!userDoc) {
                return res.status(401).json({ message: 'Not authorized, user account not found. Please log in again.' });
            }

            req.user = userDoc;
            next();
        } catch (error) {
            console.error('JWT Verification Error:', error.message);
            res.status(401).json({ message: 'Not authorized, token invalid or expired' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token provided' });
    }
};

const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as an admin' });
    }
};

module.exports = { protect, admin };
