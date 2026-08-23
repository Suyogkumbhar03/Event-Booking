const { Resend } = require('resend');
const nodemailer = require('nodemailer');

// ─────────────────────────────────────────────────────────
// Resend API client (HTTPS port 443 – works on Render free)
// ─────────────────────────────────────────────────────────
const getResendClient = () => {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  return new Resend(key);
};

// ─────────────────────────────────────────────────────────
// Nodemailer SMTP fallback (Gmail – blocked on some hosts)
// ─────────────────────────────────────────────────────────
const smtpTransporter = nodemailer.createTransport({
  service: 'gmail',
  pool: true,
  maxConnections: 3,
  maxMessages: 50,
  auth: {
    user: process.env.EMAIL_USER?.trim(),
    pass: process.env.EMAIL_PASS?.replace(/\s+/g, '').trim(),
  },
  socketTimeout: 10000,   // 10s timeout to prevent hanging
  connectionTimeout: 10000,
});

const OTP_HTML = (otpCode) => `
<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #DCD7CE;border-radius:8px;background:#fff;">
  <h2 style="color:#C84B31;margin-bottom:8px;">Eventora Access</h2>
  <p style="font-size:14px;color:#52504A;">Your 6-digit verification code is:</p>
  <div style="margin:20px 0;">
    <span style="font-size:28px;font-weight:700;letter-spacing:6px;color:#141413;background:#F9F7F2;padding:10px 20px;border-radius:6px;display:inline-block;">
      ${otpCode}
    </span>
  </div>
  <p style="font-size:12px;color:#848B98;">Valid for 5 minutes. If you did not request this, ignore this email.</p>
</div>`;

const sendOtpEmail = async (toEmail, otpCode) => {
  const resend = getResendClient();

  // 1. Try Resend first (works on Render, uses HTTPS)
  if (resend) {
    try {
      const { data, error } = await resend.emails.send({
        from: 'Eventora <onboarding@resend.dev>',
        to: [toEmail],
        subject: `Your Eventora Verification Code: ${otpCode}`,
        html: OTP_HTML(otpCode),
      });
      if (error) throw new Error(error.message);
      console.log(`✅ [Resend] OTP delivered to ${toEmail}. ID: ${data?.id}`);
      return data;
    } catch (resendErr) {
      console.error('❌ [Resend] Error:', resendErr.message, '— falling back to SMTP');
    }
  }

  // 2. SMTP fallback (local dev / non-blocked hosts)
  const info = await smtpTransporter.sendMail({
    from: `"Eventora" <${process.env.EMAIL_USER?.trim()}>`,
    to: toEmail,
    subject: `Your Eventora Verification Code: ${otpCode}`,
    html: OTP_HTML(otpCode),
  });
  console.log(`✅ [SMTP] OTP delivered to ${toEmail}. Message ID: ${info.messageId}`);
  return info;
};

const sendBookingEmail = async (userEmail, userName, eventTitle) => {
  const resend = getResendClient();

  const html = `
  <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:20px;border:1px solid #eee;border-radius:8px;">
    <h2 style="color:#c84b31;">Hi ${userName}!</h2>
    <p style="color:#475569;">Your booking for <strong>${eventTitle}</strong> is confirmed.</p>
    <p style="font-size:13px;color:#94a3b8;">Thank you for choosing Eventora!</p>
  </div>`;

  if (resend) {
    try {
      const { data, error } = await resend.emails.send({
        from: 'Eventora <onboarding@resend.dev>',
        to: [userEmail],
        subject: `Booking Confirmed: ${eventTitle}`,
        html,
      });
      if (error) throw new Error(error.message);
      console.log(`✅ [Resend] Booking email to ${userEmail}. ID: ${data?.id}`);
      return data;
    } catch (resendErr) {
      console.error('❌ [Resend] Booking email error:', resendErr.message, '— falling back to SMTP');
    }
  }

  const info = await smtpTransporter.sendMail({
    from: `"Eventora" <${process.env.EMAIL_USER?.trim()}>`,
    to: userEmail,
    subject: `Booking Confirmed: ${eventTitle}`,
    html,
  });
  console.log(`✅ [SMTP] Booking email to ${userEmail}. Message ID: ${info.messageId}`);
  return info;
};

module.exports = { sendOtpEmail, sendOTPEmail: sendOtpEmail, sendBookingEmail };
