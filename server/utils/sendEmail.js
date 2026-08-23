const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config();

const cleanUser = (process.env.EMAIL_USER || process.env.SMTP_USER || "").trim();
const rawPass = process.env.EMAIL_PASS || process.env.SMTP_PASS || "";
const cleanPass = rawPass.replace(/\s+/g, "").trim();

const smtpHost = (process.env.EMAIL_HOST || process.env.SMTP_HOST || "smtp.gmail.com").trim();
const smtpPort = parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || "465", 10);
const isSecure = smtpPort === 465;

// Pure Nodemailer Transporter with Gmail service integration
const transporter = nodemailer.createTransport(
  cleanUser && cleanPass
    ? {
        service: "gmail",
        auth: {
          user: cleanUser,
          pass: cleanPass
        },
        tls: {
          rejectUnauthorized: false
        }
      }
    : {
        service: "gmail",
        auth: {
          user: cleanUser,
          pass: cleanPass
        },
        tls: {
          rejectUnauthorized: false
        }
      }
);

// Verify SMTP connection configuration on server startup (non-blocking)
if (cleanUser && cleanPass) {
  transporter.verify((error, success) => {
    if (error) {
      console.warn("\n⚠️ [Nodemailer SMTP Notice] SMTP transporter verification status:", error.message);
      console.warn("📌 OTP codes are saved in MongoDB and printed in terminal logs below!\n");
    } else {
      console.log("✅ Nodemailer SMTP connection successfully verified and ready to send live emails");
    }
  });
}

const sendOtpEmail = async (toEmail, otpCode) => {
  const targetEmail = toEmail.toLowerCase().trim();

  // Always log OTP prominently in server console
  console.log("\n=======================================================");
  console.log(`[EVENTORA OTP GENERATED] Recipient: ${targetEmail} | OTP: ${otpCode}`);
  console.log("=======================================================\n");

  if (!cleanUser || !cleanPass) {
    console.log("ℹ️ [Nodemailer] EMAIL_USER / EMAIL_PASS not configured in Render environment variables.");
    console.log("📌 OTP Code active in MongoDB & logged above. Add EMAIL_USER & EMAIL_PASS on Render to receive real emails.");
    return { success: true, messageId: `dev-otp-${Date.now()}` };
  }

  const fromSender = cleanUser ? `"Eventora" <${cleanUser}>` : '"Eventora Access" <no-reply@eventora.com>';

  const mailOptions = {
    from: fromSender,
    to: targetEmail,
    subject: `Your Eventora Verification Code: ${otpCode}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <h2 style="color: #c84b31; text-align: center; margin-bottom: 8px;">Eventora Access</h2>
        <p style="font-size: 14px; color: #475569; text-align: center;">Enter the verification code below to proceed with your authentication.</p>
        <div style="text-align: center; margin: 28px 0;">
          <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #141413; background: #f9f7f2; border: 1px solid #dcd7ce; padding: 12px 24px; border-radius: 8px; display: inline-block;">
            ${otpCode}
          </span>
        </div>
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">This code will expire in 5 minutes. If you did not request this code, please ignore this email.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Live Email sent successfully via Nodemailer to ${targetEmail}:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.warn(`⚠️ Nodemailer Socket/Delivery Warning for ${targetEmail}: ${error.message}`);
    console.warn(`📌 OTP ${otpCode} is active in MongoDB and printed in terminal above.`);
    return { success: true, messageId: `dev-otp-${Date.now()}`, warning: error.message };
  }
};

const sendBookingEmail = async (userEmail, userName, eventTitle) => {
  const targetEmail = userEmail.toLowerCase().trim();
  const fromSender = cleanUser ? `"Eventora" <${cleanUser}>` : '"Eventora Tickets" <no-reply@eventora.com>';

  const mailOptions = {
    from: fromSender,
    to: targetEmail,
    subject: `Booking Confirmed: ${eventTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #c84b31;">Hi ${userName}!</h2>
        <p style="color: #475569;">Your booking for the event <strong>${eventTitle}</strong> is confirmed.</p>
        <p style="color: #94a3b8; font-size: 13px;">Thank you for choosing Eventora!</p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Booking confirmation email sent via Nodemailer to ${targetEmail}:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.warn(`⚠️ Booking email delivery warning for ${targetEmail}:`, error.message);
  }
};

module.exports = {
  sendOtpEmail,
  sendOTPEmail: sendOtpEmail,
  sendBookingEmail,
  transporter
};
