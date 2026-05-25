const express = require("express");
const router = express.Router();
const User = require("../models/user");
const { restrictToLoggedInUserOnly } = require("../middlewares/authentication");
const NotificationService = require("../services/notificationService");

router.use(restrictToLoggedInUserOnly);

// ====================== FOLLOW USER ======================
router.post("/:userId/follow", async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user._id.toString();

        // Validate user ID format
        if (!userId || userId === currentUserId) {
            return res.status(400).json({ 
                success: false, 
                message: "Cannot follow yourself" 
            });
        }

        // Get fresh user data from database
        const currentUser = await User.findById(currentUserId);
        if (!currentUser) {
            return res.status(401).json({ 
                success: false, 
                message: "User session invalid" 
            });
        }

        const targetUser = await User.findById(userId);
        if (!targetUser) {
            return res.status(404).json({ 
                success: false, 
                message: "User not found" 
            });
        }

        // Check if already following
        const isFollowing = currentUser.isFollowing(userId);

        if (isFollowing) {
            // UNFOLLOW: Remove from current user's following list
            await User.findByIdAndUpdate(
                currentUserId,
                { $pull: { following: userId } },
                { new: true }
            );

            // Remove current user from target user's followers list
            await User.findByIdAndUpdate(
                userId,
                { $pull: { followers: currentUserId } },
                { new: true }
            );

            return res.json({ 
                success: true, 
                following: false,
                message: "Unfollowed successfully"
            });
        } else {
            // FOLLOW: Add to current user's following list
            await User.findByIdAndUpdate(
                currentUserId,
                { $addToSet: { following: userId } },
                { new: true }
            );

            // Add current user to target user's followers list
            await User.findByIdAndUpdate(
                userId,
                { $addToSet: { followers: currentUserId } },
                { new: true }
            );

            // Send notification to target user
            try {
                await NotificationService.createNotification(
                    userId,
                    "follow",
                    {
                        title: "New follower",
                        message: `${currentUser.fullName} started following you`,
                        actor: currentUserId
                    }
                );

                // Send email notification
                await NotificationService.sendEmailNotification(targetUser, "follow", {
                    actorName: currentUser.fullName
                });
            } catch (notifError) {
                console.error("Notification error (non-critical):", notifError);
                // Don't fail the follow operation if notification fails
            }

            return res.json({ 
                success: true, 
                following: true,
                message: "Followed successfully"
            });
        }
    } catch (error) {
        console.error("Follow Error:", error);
        res.status(500).json({ 
            success: false, 
            message: error.message || "Failed to follow user" 
        });
    }
});

// ====================== GET FOLLOWERS ======================
router.get("/:userId/followers", async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1 } = req.query;
        const limit = 20;
        const skip = (page - 1) * limit;

        const user = await User.findById(userId)
            .populate({
                path: "followers",
                select: "fullName profileImageURL bio",
                options: { skip, limit }
            });

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: "User not found" 
            });
        }

        const total = await User.findById(userId).then(u => u.followers.length);

        res.json({
            success: true,
            followers: user.followers,
            total,
            pages: Math.ceil(total / limit),
            currentPage: parseInt(page)
        });
    } catch (error) {
        console.error("Error fetching followers:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to fetch followers" 
        });
    }
});

// ====================== GET FOLLOWING ======================
router.get("/:userId/following", async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1 } = req.query;
        const limit = 20;
        const skip = (page - 1) * limit;

        const user = await User.findById(userId)
            .populate({
                path: "following",
                select: "fullName profileImageURL bio",
                options: { skip, limit }
            });

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: "User not found" 
            });
        }

        const total = await User.findById(userId).then(u => u.following.length);

        res.json({
            success: true,
            following: user.following,
            total,
            pages: Math.ceil(total / limit),
            currentPage: parseInt(page)
        });
    } catch (error) {
        console.error("Error fetching following:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to fetch following" 
        });
    }
});

module.exports = router;
