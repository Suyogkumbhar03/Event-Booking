const nodemailer = require('nodemailer');

/**
 * Create a fresh transporter on each call.
 * Gmail App Password must be 16 characters with no spaces.
 */
const createTransporter = () => {
  const user = (process.env.EMAIL_USER || '').trim();
  const pass = (process.env.EMAIL_PASS || '').replace(/\s/g, '').trim();

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // STARTTLS
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
    pool: false,
    socketTimeout: 15000,
    connectionTimeout: 15000,
  });
};

/**
 * Send OTP verification email.
 * @param {string} toEmail  Recipient email address
 * @param {string} otpCode  6-digit OTP
 */
const sendOtpEmail = (toEmail, otpCode) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"Eventora" <${(process.env.EMAIL_USER || '').trim()}>`,
    to: toEmail,
    subject: `[Eventora] Your verification code: ${otpCode}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:460px;margin:auto;padding:28px;border:1px solid #e2e8f0;border-radius:10px;">
        <h2 style="color:#C84B31;margin:0 0 8px;">Eventora — Verify Your Account</h2>
        <p style="color:#52504A;font-size:14px;">Use the code below to complete your sign-up or login:</p>
        <div style="margin:24px 0;text-align:center;">
          <span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#141413;background:#F9F7F2;padding:12px 24px;border-radius:8px;display:inline-block;border:1px dashed #C84B31;">
            ${otpCode}
          </span>
        </div>
        <p style="color:#94a3b8;font-size:12px;">This code is valid for <strong>5 minutes</strong>. If you didn't request it, ignore this email.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

/**
 * Send booking confirmation email (non-critical, best effort).
 */
const sendBookingEmail = (userEmail, userName, eventTitle) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"Eventora" <${(process.env.EMAIL_USER || '').trim()}>`,
    to: userEmail,
    subject: `[Eventora] Booking Confirmed — ${eventTitle}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:460px;margin:auto;padding:24px;border:1px solid #e2e8f0;border-radius:10px;">
        <h2 style="color:#C84B31;">Hi ${userName}!</h2>
        <p style="color:#475569;">Your booking for <strong>${eventTitle}</strong> is confirmed. We look forward to seeing you there!</p>
        <p style="color:#94a3b8;font-size:13px;">— The Eventora Team</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = { sendOtpEmail, sendOTPEmail: sendOtpEmail, sendBookingEmail };
