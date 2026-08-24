const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (user) =>
    jwt.sign(
        { id: user._id, role: user.role, email: user.email },
        process.env.JWT_SECRET || 'eventora_jwt_secret_2026',
        { expiresIn: '30d' }
    );

// POST /api/auth/register
exports.register = async (req, res) => {
    try {
        const name = (req.body.name || '').trim();
        const email = (req.body.email || '').trim().toLowerCase();
        const password = req.body.password || '';

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required.' });
        }

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ success: false, message: 'An account with this email already exists. Please log in.' });
        }

        const salt = await bcrypt.genSalt(8);
        const hashedPwd = await bcrypt.hash(password, salt);

        const user = await User.create({
            name: name || email.split('@')[0],
            email,
            password: hashedPwd,
            role: 'user',
            isVerified: true, // No OTP needed — verified on registration
        });

        const token = generateToken(user);

        return res.status(201).json({
            success: true,
            message: 'Account created successfully.',
            token,
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        });
    } catch (err) {
        console.error('register error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/auth/login
exports.login = async (req, res) => {
    try {
        const email = (req.body.email || '').trim().toLowerCase();
        const password = req.body.password || '';

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required.' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const token = generateToken(user);

        return res.status(200).json({
            success: true,
            token,
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        });
    } catch (err) {
        console.error('login error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/auth/verify-password
// Used by the booking flow to confirm identity before booking
exports.verifyPassword = async (req, res) => {
    try {
        const email = (req.body.email || '').trim().toLowerCase();
        const password = req.body.password || '';

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required.' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Incorrect password.' });
        }

        return res.status(200).json({ success: true, message: 'Password verified.' });
    } catch (err) {
        console.error('verifyPassword error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};
