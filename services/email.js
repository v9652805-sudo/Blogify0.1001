const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Verify connection on startup
transporter.verify((error) => {
    if (error) {
        console.error("❌ EMAIL TRANSPORTER CONNECTION FAILED:", error.message);
    } else {
        console.log("✅ Email Transporter is Ready to Send Emails");
    }
});

const sendOTPEmail = async (email, otp) => {
    const mailOptions = {
        from: `"Blogify" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Your Signup Verification Code - Blogify',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 25px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #4CAF50; text-align: center;">Verify Your Email</h2>
                <h1 style="text-align: center; letter-spacing: 12px; font-size: 52px; color: #333;">${otp}</h1>
                <p style="text-align: center; color: #666; font-size: 16px;">This code will expire in 5 minutes.</p>
                <p style="text-align: center; color: #999;">If you didn't request this, ignore this email.</p>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ OTP EMAIL SENT SUCCESSFULLY to ${email}`);
        console.log(`Message ID: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error("❌ FAILED TO SEND EMAIL:");
        console.error("Error Code:", error.code);
        console.error("Error Message:", error.message);
        if (error.response) console.error("Response:", error.response);
        throw error;
    }
};

module.exports = { sendOTPEmail };
