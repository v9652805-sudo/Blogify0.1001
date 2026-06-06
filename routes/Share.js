const express = require("express");
const router = express.Router();
const { restrictToLoggedInUserOnly } = require("../middlewares/authentication");
const ShareAnalyticsService = require("../services/shareAnalyticsService");

// ====================== CREATE SHARE TRACKING ======================
router.post("/create", restrictToLoggedInUserOnly, async (req, res) => {
    try {
        const { blogId, platform, message = "" } = req.body;

        if (!blogId || !platform) {
            return res.status(400).json({
                success: false,
                message: "Blog ID and platform are required"
            });
        }

        const result = await ShareAnalyticsService.createShare(
            blogId,
            req.user._id,
            platform,
            message
        );

        res.json(result);
    } catch (error) {
        console.error("Error creating share:", error);
        res.status(500).json({ success: false, message: "Failed to create share" });
    }
});

// ====================== TRACK SHARE CLICK ======================
router.post("/track/:referralCode", async (req, res) => {
    try {
        const { referralCode } = req.params;
        const userAgent = req.headers["user-agent"] || "";
        const ip = req.ip || req.connection.remoteAddress || "";

        const result = await ShareAnalyticsService.trackShareClick(
            referralCode,
            req.user?._id || null,
            userAgent,
            ip
        );

        res.json(result);
    } catch (error) {
        console.error("Error tracking share click:", error);
        res.status(500).json({ success: false, message: "Failed to track share" });
    }
});

// ====================== GET BLOG SHARE STATS ======================
router.get("/blog/:blogId/stats", restrictToLoggedInUserOnly, async (req, res) => {
    try {
        const { blogId } = req.params;
        const stats = await ShareAnalyticsService.getBlogShareStats(blogId);
        
        res.json({ success: true, stats });
    } catch (error) {
        console.error("Error getting blog share stats:", error);
        res.status(500).json({ success: false, message: "Failed to fetch share stats" });
    }
});

// ====================== GET USER SHARE STATS ======================
router.get("/user/stats", restrictToLoggedInUserOnly, async (req, res) => {
    try {
        const stats = await ShareAnalyticsService.getUserShareStats(req.user._id);
        res.json({ success: true, stats });
    } catch (error) {
        console.error("Error getting user share stats:", error);
        res.status(500).json({ success: false, message: "Failed to fetch user share stats" });
    }
});

// ====================== GET TOP SHARED BLOGS ======================
router.get("/trending/top", async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const topShared = await ShareAnalyticsService.getTopSharedBlogs(parseInt(limit));
        
        res.json({ success: true, blogs: topShared });
    } catch (error) {
        console.error("Error getting top shared blogs:", error);
        res.status(500).json({ success: false, message: "Failed to fetch top shared blogs" });
    }
});

// ====================== GET SHARE PERFORMANCE ======================
router.get("/blog/:blogId/performance", restrictToLoggedInUserOnly, async (req, res) => {
    try {
        const { blogId } = req.params;
        const { days = 30 } = req.query;
        
        const performance = await ShareAnalyticsService.getSharePerformance(
            blogId,
            parseInt(days)
        );
        
        res.json({ success: true, performance });
    } catch (error) {
        console.error("Error getting share performance:", error);
        res.status(500).json({ success: false, message: "Failed to fetch performance data" });
    }
});

module.exports = router;
