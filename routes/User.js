// routes/User.js
const { Router } = require("express");
const User = require("../models/user");
const { creatTokenForUser } = require("../services/authentication");

const router = Router();

// ====================== NORMAL ROUTES ======================
router.get("/signin", (req, res) => res.render("signin"));
router.get("/signup", (req, res) => res.render("signup"));

router.post("/signup", async (req, res) => {
    const { fullName, email, password } = req.body;
    try {
        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.render("signup", { error: "Email already registered" });
        }
        await User.create({ fullName, email: email.toLowerCase(), password });
        res.redirect("/user/signin");
    } catch (error) {
        console.error(error);
        res.render("signup", { error: "Something went wrong" });
    }
});

router.post("/signin", async (req, res) => {
    try {
        const token = await User.matchPassword(req.body.email, req.body.password);
        res.cookie("token", token, { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000 
        }).redirect("/");
    } catch (e) {
        res.render("signin", { error: "Invalid credentials" });
    }
});

// ====================== LOGOUT ======================
router.get("/logout", (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax"
    });
    res.redirect("/");
});

module.exports = router;
