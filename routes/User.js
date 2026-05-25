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
    res.render('signin', { error: null });
});

// ====================== POST SIGNIN ======================
router.post('/signin', loginLimiter, async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: "Email and password are required" 
            });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid email format" 
            });
        }

        const token = await User.matchPassword(email, password);
        
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        
        res.status(200).json({ 
            success: true, 
            message: "Login successful",
            redirect: "/" 
        });
    } catch (error) {
        console.error("Signin Error:", error);
        res.status(401).json({ 
            success: false, 
            message: error.message || "Invalid email or password" 
        });
    }
});

// ====================== LOGOUT ======================
router.get('/logout', (req, res) => {
    res.clearCookie("token");
    res.redirect('/');
});

router.post('/logout', (req, res) => {
    res.clearCookie("token");
    res.status(200).json({ 
        success: true, 
        message: "Logged out successfully" 
    });
});

// ====================== GET SIGNUP PAGE ======================
router.get('/signup', (req, res) => {
    res.render('signup', { error: null });
});

// ====================== SEND OTP ======================
router.post('/send-otp', otpLimiter, async (req, res) => {
    const { email } = req.body;

    if (!email || !validateEmail(email)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Valid email is required' 
        });
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
        const expires = Date.now() + 5 * 60 * 1000; // 5 minutes

        otpStore.set(normalizedEmail, { otp, expires });

        await sendOTPEmail(normalizedEmail, otp);

        res.json({ 
            success: true, 
            message: 'OTP sent successfully to your email' 
        });
    } catch (error) {
        console.error("🚨 Send OTP Error:", error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to send OTP. Please try again.' 
        });
    }
});

// ====================== SIGNUP ======================
router.post('/signup', async (req, res) => {
    const { fullName, email, password, otp } = req.body;

    if (!fullName || !email || !password || !otp) {
        return res.status(400).json({ 
            success: false, 
            message: "All fields are required" 
        });
    }

    try {
        const normalizedEmail = email.toLowerCase().trim();

        if (!validateEmail(normalizedEmail)) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid email format" 
            });
        }

        const stored = otpStore.get(normalizedEmail);
        if (!stored || stored.otp !== otp || stored.expires < Date.now()) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid or expired OTP" 
            });
        }

        const user = await User.create({
            fullName: fullName.trim(),
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

        res.json({ 
            success: true, 
            message: "Account created successfully!",
            redirect: "/" 
        });
    } catch (error) {
        console.error("Signup Error:", error);
        res.status(500).json({ 
            success: false, 
            message: error.message || "Signup failed. Please try again." 
        });
    }
});

// ====================== FORGOT PASSWORD ======================
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    if (!email || !validateEmail(email)) {
        return res.status(400).json({ 
            success: false, 
            message: "Valid email is required" 
        });
    }

    try {
        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: "No account found with this email" 
            });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const tokenExpires = Date.now() + 30 * 60 * 1000; // 30 minutes

        resetTokens.set(resetToken, { 
            email: normalizedEmail, 
            expires: tokenExpires 
        });

        const resetLink = `${process.env.APP_URL || 'http://localhost:8000'}/user/reset-password?token=${resetToken}`;

        await require('../services/email').sendEmail(
            normalizedEmail,
            "Reset Your Blogify Password",
            `<p>Click the link below to reset your password:</p>
             <p><a href="${resetLink}">Reset Password</a></p>
             <p>This link will expire in 30 minutes.</p>`
        );

        res.json({ 
            success: true, 
            message: "Password reset link sent to your email" 
        });
    } catch (error) {
        console.error("Forgot Password Error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to send reset link. Please try again." 
        });
    }
});

// ====================== RESET PASSWORD ======================
router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ 
            success: false, 
            message: "Token and new password are required" 
        });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ 
            success: false, 
            message: "Password must be at least 6 characters" 
        });
    }

    try {
        const stored = resetTokens.get(token);

        if (!stored || stored.expires < Date.now()) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid or expired reset link" 
            });
        }

        const user = await User.findOne({ email: stored.email });
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: "User not found" 
            });
        }

        user.password = newPassword;
        await user.save();

        resetTokens.delete(token);

        res.json({ 
            success: true, 
            message: "Password reset successfully. Please login." 
        });
    } catch (error) {
        console.error("Reset Password Error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to reset password" 
        });
    }
});

module.exports = router;
