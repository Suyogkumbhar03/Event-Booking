const User = require('../models/User');
const OTP = require('../models/OTP');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendOtpEmail } = require('../utils/sendEmail');

const generateOTPCode = () => Math.floor(100000 + Math.random() * 900000).toString();

const generateToken = (id, role, email) => {
    return jwt.sign({ id, role, email }, process.env.JWT_SECRET || 'eventora_jwt_secure_key_2026', { expiresIn: '30d' });
};

// @desc    Send OTP to user's email for authentication / registration
// @route   POST /api/auth/send-otp
// @access  Public
exports.sendOTP = async (req, res) => {
    console.log("➡️ Received send-otp request body:", req.body);
    const email = req.body.email?.trim().toLowerCase();

    if (!email) {
        return res.status(400).json({ success: false, message: "Email is required." });
    }

    try {
        const otpCode = generateOTPCode();
        const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiration

        // 1. Save or update user with OTP in MongoDB FIRST
        let user = await User.findOne({ email });
        if (!user) {
            const hashedPassword = '$2a$10$Wp2c4mP1bZ5/9r5KzX4uLeN1b0.pT6/4Z.5F7S8.q1.';
            user = new User({
                name: email.split('@')[0],
                email,
                password: hashedPassword,
                role: 'user',
                isVerified: false
            });
        }
        user.otp = otpCode;
        user.otpExpiresAt = otpExpiresAt;
        await user.save();

        await Promise.all([
            OTP.deleteMany({ email }),
            OTP.create({ email, otp: otpCode, action: 'account_verification' })
        ]);

        console.log(`✅ Saved OTP ${otpCode} in database for ${email}`);

        // 2. Attempt async email dispatch without hanging the HTTP response
        sendOtpEmail(email, otpCode)
            .then(() => console.log(`📧 Email delivered to ${email}`))
            .catch((mailErr) => console.error("❌ Mail dispatch error:", mailErr.message));

        return res.status(200).json({
            success: true,
            message: "Verification code sent to your email."
        });
    } catch (err) {
        console.error("❌ sendOTP controller error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Verify OTP and log in / complete registration
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ success: false, message: 'Email and verification code are required' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const cleanOtp = String(otp).trim();

        let user = await User.findOne({ email: normalizedEmail });
        const backupOTPRecord = await OTP.findOne({ email: normalizedEmail, otp: cleanOtp });

        if (!user && !backupOTPRecord) {
            return res.status(400).json({ success: false, message: 'User not found. Please request a new verification code.' });
        }

        // Check if OTP matches either user.otp or backup OTP collection record
        const isValidInUser = user && user.otp && String(user.otp).trim() === cleanOtp;

        if (!isValidInUser && !backupOTPRecord) {
            return res.status(400).json({ success: false, message: 'Invalid verification code. Please check and try again.' });
        }

        // Check expiration only if verified via user.otp and no valid backupOTPRecord exists
        const now = new Date();
        if (user && user.otpExpiresAt && user.otpExpiresAt < now && !backupOTPRecord) {
            return res.status(400).json({ success: false, message: 'Verification code expired. Please request a new code.' });
        }

        // If user document didn't exist yet, create verified user record instantly
        if (!user) {
            const hashedPassword = '$2a$10$Wp2c4mP1bZ5/9r5KzX4uLeN1b0.pT6/4Z.5F7S8.q1.';
            user = await User.create({
                name: normalizedEmail.split('@')[0],
                email: normalizedEmail,
                password: hashedPassword,
                role: 'user',
                isVerified: true
            });
        } else {
            user.otp = undefined;
            user.otpExpiresAt = undefined;
            user.isVerified = true;
            await user.save();
        }

        // Clean up backup OTP records
        await OTP.deleteMany({ email: normalizedEmail });

        const token = generateToken(user._id, user.role, user.email);

        res.status(200).json({
            success: true,
            message: 'Verification successful',
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isVerified: user.isVerified,
            token
        });
    } catch (error) {
        console.error('Error in verifyOTP controller:', error);
        res.status(500).json({ success: false, message: 'Server error during verification', error: error.message });
    }
};

// @desc    Register a new user (traditional email/password)
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    console.log("➡️ Received register request body:", req.body);
    try {
        const { name, email, password } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email address is required' });
        }

        const normalizedEmail = email.toLowerCase().trim();

        let user = await User.findOne({ email: normalizedEmail });
        if (user && user.isVerified) {
            return res.status(400).json({ success: false, message: 'User with this email already exists' });
        }

        const salt = await bcrypt.genSalt(8);
        const hashedPassword = await bcrypt.hash(password || 'password123', salt);
        const otpCode = generateOTPCode();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        // 1. Save user & OTP to MongoDB FIRST
        if (user) {
            user.name = name || user.name;
            user.password = hashedPassword;
            user.otp = otpCode;
            user.otpExpiresAt = expiresAt;
            await user.save();
        } else {
            user = await User.create({
                name: name || normalizedEmail.split('@')[0],
                email: normalizedEmail,
                password: hashedPassword,
                role: 'user',
                isVerified: false,
                otp: otpCode,
                otpExpiresAt: expiresAt
            });
        }

        await Promise.all([
            OTP.deleteMany({ email: normalizedEmail }),
            OTP.create({ email: normalizedEmail, otp: otpCode, action: 'account_verification' })
        ]);

        console.log(`✅ Saved OTP ${otpCode} in database for ${normalizedEmail}`);

        // 2. Non-blocking async email dispatch
        sendOtpEmail(normalizedEmail, otpCode)
            .then(() => console.log(`📧 Email delivered to ${normalizedEmail}`))
            .catch((mailErr) => console.error("❌ Mail dispatch error:", mailErr.message));

        return res.status(201).json({
            success: true,
            message: 'Verification code sent to your email.',
            email: user.email
        });
    } catch (error) {
        console.error('❌ Error in register controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to process registration.',
            error: error.message
        });
    }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    console.log("➡️ Received login request body:", req.body);
    try {
        const { email, password } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email address is required' });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid email or password' });
        }

        if (password) {
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ success: false, message: 'Invalid email or password' });
            }
        }

        if (!user.isVerified && user.role !== 'admin') {
            const otpCode = generateOTPCode();
            const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

            user.otp = otpCode;
            user.otpExpiresAt = expiresAt;
            await user.save();

            await Promise.all([
                OTP.deleteMany({ email: normalizedEmail }),
                OTP.create({ email: normalizedEmail, otp: otpCode, action: 'account_verification' })
            ]);

            console.log(`✅ Saved OTP ${otpCode} in database for unverified login ${normalizedEmail}`);

            sendOtpEmail(normalizedEmail, otpCode)
                .then(() => console.log(`📧 Email delivered to ${normalizedEmail}`))
                .catch((mailErr) => console.error("❌ Mail dispatch error:", mailErr.message));

            return res.status(403).json({
                success: false,
                message: 'Account not verified. A new verification code has been sent to your email.',
                needsVerification: true,
                email: user.email
            });
        }

        const token = generateToken(user._id, user.role, user.email);

        return res.json({
            success: true,
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token
        });
    } catch (error) {
        console.error('❌ Error in login controller:', error);
        return res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

exports.sendBookingOTP = exports.sendOTP;
