// services/email.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

const sendOTP = async (email, otp) => {
    try {
        const mailOptions = {
            from: `"Blogify" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Your Blogify Signup OTP Code',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; border: 1px solid #ddd; border-radius: 12px; background-color: #f9f9f9;">
                    <h2 style="color: #667eea; text-align: center;">Verify Your Email Address</h2>
                    <p style="font-size: 16px; text-align: center;">Use the following OTP to complete your signup:</p>
                    <h1 style="color: #667eea; letter-spacing: 12px; font-size: 48px; text-align: center; margin: 20px 0;">${otp}</h1>
                    <p style="text-align: center; color: #666;">
                        This code will expire in <strong>5 minutes</strong>.
                    </p>
                    <p style="text-align: center; color: #999; font-size: 14px;">
                        If you didn't request this code, please ignore this email.
                    </p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ OTP sent successfully to ${email} | Message ID: ${info.messageId}`);
        return true;

    } catch (error) {
        console.error("❌ Failed to send OTP email:", error.message);
        return false;
    }
};

module.exports = { sendOTP };
