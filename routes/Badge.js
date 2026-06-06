const express = require("express");
const router = express.Router();
const { restrictToLoggedInUserOnly } = require("../middlewares/authentication");
const BadgeService = require("../services/badgeService");

// ====================== GET ALL BADGES (PUBLIC) ======================
router.get("/", async (req, res) => {
    try {
        const badges = await BadgeService.getAllBadges();
        res.json({ success: true, badges });
    } catch (error) {
        console.error("Error getting badges:", error);
        res.status(500).json({ success: false, message: "Failed to fetch badges" });
    }
});

// ====================== GET USER BADGES ======================
router.get("/user/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const badges = await BadgeService.getUserBadges(userId);
        res.json({ success: true, badges });
    } catch (error) {
        console.error("Error getting user badges:", error);
        res.status(500).json({ success: false, message: "Failed to fetch user badges" });
    }
});

// ====================== GET MY BADGES ======================
router.get("/my", restrictToLoggedInUserOnly, async (req, res) => {
    try {
        const badges = await BadgeService.getUserBadges(req.user._id);
        res.json({ success: true, badges });
    } catch (error) {
        console.error("Error getting my badges:", error);
        res.status(500).json({ success: false, message: "Failed to fetch your badges" });
    }
});

// ====================== GET BADGE PROGRESS ======================
router.get("/progress/my", restrictToLoggedInUserOnly, async (req, res) => {
    try {
        const progress = await BadgeService.getBadgeProgress(req.user._id);
        const badges = await BadgeService.getAllBadges();
        
        res.json({ success: true, progress, badges });
    } catch (error) {
        console.error("Error getting badge progress:", error);
        res.status(500).json({ success: false, message: "Failed to fetch badge progress" });
    }
});

// ====================== MANUAL BADGE CHECK (Admin/Cron) ======================
router.post("/check/:userId", restrictToLoggedInUserOnly, async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Optional: Add admin check here
        await BadgeService.checkAndAwardBadges(userId);
        
        const badges = await BadgeService.getUserBadges(userId);
        res.json({ success: true, message: "Badges checked and awarded", badges });
    } catch (error) {
        console.error("Error checking badges:", error);
        res.status(500).json({ success: false, message: "Failed to check badges" });
    }
});

// ====================== INITIALIZE DEFAULT BADGES (Admin only) ======================
router.post("/initialize", restrictToLoggedInUserOnly, async (req, res) => {
    try {
        // Optional: Add admin check here
        await BadgeService.initializeDefaultBadges();
        res.json({ success: true, message: "Default badges initialized" });
    } catch (error) {
        console.error("Error initializing badges:", error);
        res.status(500).json({ success: false, message: "Failed to initialize badges" });
    }
});

module.exports = router;

