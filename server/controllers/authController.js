const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const OTP = require('../models/OTP');
const { sendOtpEmail } = require('../utils/sendEmail');

// ─── Helpers ─────────────────────────────────────────────────────────────────

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const generateToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET || 'eventora_jwt_secret_2026',
    { expiresIn: '30d' }
  );

/**
 * Save or update a User with the given OTP, then record it in the OTP collection.
 * Returns the saved user document.
 */
const saveUserOTP = async (email, otpCode, extraFields = {}) => {
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

  let user = await User.findOne({ email });

  if (!user) {
    // Create a minimal user document (password can be set later on first verify)
    const salt = await bcrypt.genSalt(8);
    const defaultPwd = await bcrypt.hash('eventora_placeholder', salt);
    user = new User({
      name: extraFields.name || email.split('@')[0],
      email,
      password: extraFields.password || defaultPwd,
      role: 'user',
      isVerified: false,
    });
  } else {
    // Allow update of name/password if provided
    if (extraFields.name) user.name = extraFields.name;
    if (extraFields.password) user.password = extraFields.password;
  }

  user.otp = otpCode;
  user.otpExpiresAt = expiresAt;
  await user.save();

  // Keep backup OTP record
  await OTP.deleteMany({ email });
  await OTP.create({ email, otp: otpCode, action: 'account_verification' });

  return user;
};

/**
 * Fire-and-forget email. Never blocks the HTTP response.
 */
const dispatchEmail = (email, otp) => {
  sendOtpEmail(email, otp)
    .then(() => console.log(`📧 OTP email sent to ${email}`))
    .catch((err) => console.error(`❌ OTP email failed (${email}):`, err.message));
};

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * POST /api/auth/send-otp
 * Generate OTP, save to DB, send email in background.
 */
exports.sendOTP = async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

    const otp = generateOTP();
    await saveUserOTP(email, otp);
    dispatchEmail(email, otp);

    return res.status(200).json({ success: true, message: 'Verification code sent to your email.' });
  } catch (err) {
    console.error('sendOTP error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/auth/register
 * Hash password, save user + OTP, send email in background.
 */
exports.register = async (req, res) => {
  try {
    const name = (req.body.name || '').trim();
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';

    if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

    // Check for already-verified user
    const existing = await User.findOne({ email });
    if (existing && existing.isVerified) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists. Please log in.' });
    }

    const salt = await bcrypt.genSalt(8);
    const hashedPwd = await bcrypt.hash(password || 'eventora_placeholder', salt);

    const otp = generateOTP();
    await saveUserOTP(email, otp, { name, password: hashedPwd });
    dispatchEmail(email, otp);

    return res.status(201).json({
      success: true,
      message: 'Account created. Verification code sent to your email.',
      email,
    });
  } catch (err) {
    console.error('register error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/auth/verify-otp
 * Verify OTP, mark user as verified, return JWT.
 */
exports.verifyOTP = async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    const otp = (req.body.otp || '').trim();

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
    }

    const user = await User.findOne({ email });

    // Accept match from user document OR backup OTP collection
    const otpRecord = await OTP.findOne({ email, otp });
    const matchesUser = user && user.otp && String(user.otp).trim() === otp;

    if (!matchesUser && !otpRecord) {
      return res.status(400).json({ success: false, message: 'Invalid verification code.' });
    }

    // Check expiry (only via user.otp path)
    if (matchesUser && user.otpExpiresAt && user.otpExpiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'Code expired. Please request a new one.' });
    }

    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found. Please register again.' });
    }

    // Mark verified
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    await user.save();
    await OTP.deleteMany({ email });

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Verified successfully.',
      token,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: true,
    });
  } catch (err) {
    console.error('verifyOTP error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/auth/login
 * Verify password, issue JWT (or send verification OTP if unverified).
 */
exports.login = async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';

    if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    // Unverified user — re-send OTP
    if (!user.isVerified && user.role !== 'admin') {
      const otp = generateOTP();
      await saveUserOTP(email, otp, {});
      dispatchEmail(email, otp);

      return res.status(403).json({
        success: false,
        needsVerification: true,
        email,
        message: 'Account not verified. A new code has been sent to your email.',
      });
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

exports.sendBookingOTP = exports.sendOTP;
