const nodemailer = require("nodemailer");

const createTransporter = () => {
  const user = process.env.EMAIL_USER?.trim();
  const pass = process.env.EMAIL_PASS?.replace(/\s+/g, '').trim();

  if (!user || !pass) {
    console.error("❌ Missing EMAIL_USER or EMAIL_PASS in environment variables.");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: user,
      pass: pass,
    },
  });
};

const sendOtpEmail = async (toEmail, otpCode) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"Eventora" <${process.env.EMAIL_USER?.trim()}>`,
    to: toEmail,
    subject: `Your Eventora Verification Code: ${otpCode}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <h2 style="color: #C84B31; text-align: center; margin-bottom: 8px;">Eventora Access</h2>
        <p style="font-size: 14px; color: #475569; text-align: center;">Use this verification code to complete your login and book your ticket.</p>
        <div style="text-align: center; margin: 28px 0;">
          <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #181816; background: #F9F7F2; padding: 12px 24px; border: 1px dashed #C84B31; border-radius: 8px; display: inline-block;">
            ${otpCode}
          </span>
        </div>
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">This code will expire in 5 minutes. If you did not request this, please ignore this email.</p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`✅ Email delivered to ${toEmail}. Message ID: ${info.messageId}`);
  return info;
};

const sendBookingEmail = async (userEmail, userName, eventTitle) => {
  const transporter = createTransporter();
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
