const express = require('express');
const router = express.Router();
const User = require('../models/user');
const { sendOTPEmail } = require('../services/email');
const crypto = require('crypto');
const { loginLimiter, otpLimiter } = require('../middlewares/rateLimiting');
const { validateEmail } = require('../middlewares/validation');

const otpStore = new Map();
const resetTokens = new Map();

// ====================== GET SIGNIN PAGE ======================
router.get('/signin', (req, res) => {
    res.render('signin');
});

// ====================== POST SIGNIN ======================
router.post('/signin', loginLimiter, async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!validateEmail(email)) {
            return res.status(400).json({ success: false, message: "Invalid email format" });
        }

        const token = await User.matchPassword(email, password);
        
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        
        res.status(200).json({ success: true, message: "Login successful" });
    } catch (error) {
        res.status(401).json({ success: false, message: error.message || "Invalid credentials" });
    }
});

// ====================== LOGOUT ======================
router.get('/logout', (req, res) => {
    res.clearCookie("token");
    res.redirect('/');
});

router.post('/logout', (req, res) => {
    res.clearCookie("token");
    res.status(200).json({ success: true, message: "Logged out successfully" });
});

// ====================== GET SIGNUP PAGE ======================
router.get('/signup', (req, res) => {
    res.render('signup');
});

// ====================== SEND OTP ======================
router.post('/send-otp', otpLimiter, async (req, res) => {
    const { email } = req.body;

    console.log("📧 [Send OTP] Request for:", email);

    if (!email || !validateEmail(email)) {
        return res.status(400).json({ success: false, message: 'Valid email is required' });
    }

    try {
        const normalizedEmail = email.toLowerCase().trim();

        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email already registered. Please login instead."
            });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = Date.now() + 5 * 60 * 1000;

        otpStore.set(normalizedEmail, { otp, expires });

        await sendOTPEmail(normalizedEmail, otp);

        res.json({ success: true, message: 'OTP sent successfully' });
    } catch (error) {
        console.error("🚨 [Send OTP] Full Error:", error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to send OTP. Please check server console.' 
        });
    }
});

// ====================== SIGNUP ======================
router.post('/signup', async (req, res) => {
    const { fullName, email, password, otp } = req.body;

    if (!fullName || !email || !password || !otp) {
        return res.status(400).json({ success: false, message: "All fields are required" });
    }

    try {
        const normalizedEmail = email.toLowerCase().trim();

        if (!validateEmail(normalizedEmail)) {
            return res.status(400).json({ success: false, message: "Invalid email format" });
        }

        const stored = otpStore.get(normalizedEmail);
        if (!stored || stored.otp !== otp || stored.expires < Date.now()) {
            return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
        }

        const user = await User.create({
            fullName,
            email: normalizedEmail,
            password
        });

        otpStore.delete(normalizedEmail);

        const token = require('../services/authentication').creatTokenForUser(user);

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({ success: true, message: "Signup successful", user });
    } catch (error) {
        console.error("Signup Error:", error);
        res.status(500).json({ success: false, message: "Signup failed" });
    }
});

// ====================== FORGOT PASSWORD ======================
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    if (!email || !validateEmail(email)) {
        return res.status(400).json({ success: false, message: "Valid email is required" });
    }

    try {
        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const tokenExpires = Date.now() + 30 * 60 * 1000; // 30 minutes

        resetTokens.set(resetToken, { email: normalizedEmail, expires: tokenExpires });

        const resetLink = `${process.env.APP_URL || 'http://localhost:8000'}/user/reset-password?token=${resetToken}`;

        await require('../services/email').sendEmail(
            normalizedEmail,
            "Password Reset Request",
            `<p>Click <a href="${resetLink}">here</a> to reset your password. Link expires in 30 minutes.</p>`
        );

        res.json({ success: true, message: "Password reset link sent to email" });
    } catch (error) {
        console.error("Forgot Password Error:", error);
        res.status(500).json({ success: false, message: "Failed to process request" });
    }
});

// ====================== RESET PASSWORD ======================
router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ success: false, message: "Token and password required" });
    }

    try {
        const stored = resetTokens.get(token);

        if (!stored || stored.expires < Date.now()) {
            return res.status(400).json({ success: false, message: "Invalid or expired token" });
        }

        const user = await User.findOne({ email: stored.email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        user.password = newPassword;
        await user.save();

        resetTokens.delete(token);

        res.json({ success: true, message: "Password reset successfully" });
    } catch (error) {
        console.error("Reset Password Error:", error);
        res.status(500).json({ success: false, message: "Failed to reset password" });
    }
});

module.exports = router;
