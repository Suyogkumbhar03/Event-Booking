const nodemailer = require("nodemailer");

// Re-use persistent pooled connection
const transporter = nodemailer.createTransport({
  service: "gmail",
  pool: true, // Keep connection alive
  maxConnections: 3,
  maxMessages: 100,
  rateDelta: 1000,
  rateLimit: 5,
  auth: {
    user: process.env.EMAIL_USER?.trim(),
    pass: process.env.EMAIL_PASS?.replace(/\s+/g, '').trim(),
  },
});

const sendOtpEmail = async (toEmail, otpCode) => {
  const mailOptions = {
    from: `"Eventora" <${process.env.EMAIL_USER?.trim()}>`,
    to: toEmail,
    subject: `Your Eventora Verification Code: ${otpCode}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #DCD7CE; border-radius: 8px; background: #ffffff;">
        <h2 style="color: #C84B31; margin-bottom: 8px;">Eventora Access</h2>
        <p style="font-size: 14px; color: #52504A;">Your 6-digit verification code is:</p>
        <div style="margin: 20px 0;">
          <span style="font-size: 28px; font-weight: 700; letter-spacing: 6px; color: #141413; background: #F9F7F2; padding: 10px 20px; border-radius: 6px; display: inline-block;">
            ${otpCode}
          </span>
        </div>
        <p style="font-size: 12px; color: #848B98;">Valid for 5 minutes.</p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`✅ Email delivered to ${toEmail}. Message ID: ${info.messageId}`);
  return info;
};

const sendBookingEmail = async (userEmail, userName, eventTitle) => {
  const mailOptions = {
    from: `"Eventora" <${process.env.EMAIL_USER?.trim()}>`,
    to: userEmail,
    subject: `Booking Confirmed: ${eventTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #c84b31;">Hi ${userName}!</h2>
        <p style="color: #475569;">Your booking for the event <strong>${eventTitle}</strong> is confirmed.</p>
        <p style="color: #94a3b8; font-size: 13px;">Thank you for choosing Eventora!</p>
      </div>
    `
  };
  const info = await transporter.sendMail(mailOptions);
  console.log(`✅ Booking confirmation delivered to ${userEmail}. Message ID: ${info.messageId}`);
  return info;
};

module.exports = {
  sendOtpEmail,
  sendOTPEmail: sendOtpEmail,
  sendBookingEmail
};
