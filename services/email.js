// services/email.js
const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Test connection on startup
transporter.verify((error) => {
    if (error) {
        console.error("❌ Email Transporter Failed:", error.message);
    } else {
        console.log("✅ Email Transporter Ready");
    }
});

const sendOTP = async (email, otp) => {
    const mailOptions = {
        from: `"Blogify" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Your OTP Code - Blogify",
        html: `
            <div style="font-family: Arial, sans-serif; background:#f4f4f4; padding:20px;">
                <div style="max-width:500px; margin:0 auto; background:white; padding:30px; border-radius:10px;">
                    <h2 style="text-align:center; color:#333;">Your OTP Code</h2>
                    <div style="background:#667eea; color:white; font-size:32px; font-weight:bold; 
                                padding:20px; text-align:center; border-radius:8px; margin:20px 0; letter-spacing:4px;">
                        ${otp}
                    </div>
                    <p style="text-align:center; color:#666;">This OTP will expire in 5 minutes.</p>
                    <p style="text-align:center; color:#999; font-size:12px;">
                        If you didn't request this code, please ignore this email.
                    </p>
                </div>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ OTP Sent to ${email} | ID: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error("❌ Failed to Send OTP:");
        console.error("Code:", error.code);
        console.error("Message:", error.message);
        return false;
    }
};

module.exports = { sendOTP };
