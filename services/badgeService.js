const { Badge, UserBadge } = require("../models/Badge");
const User = require("../models/user");
const Blog = require("../models/Blog");
const Comment = require("../models/Comment");
const BlogAnalytics = require("../models/BlogAnalytics");

class BadgeService {
    
    // ====================== CREATE DEFAULT BADGES ======================
    static async initializeDefaultBadges() {
        try {
            const badges = [
                {
                    name: "first-blog",
                    title: "First Steps",
                    description: "Posted your first blog",
                    icon: "📝",
                    color: "#FF6B6B",
                    tier: "bronze",
                    requirements: { minBlogs: 1 }
                },
                {
                    name: "10-blogs",
                    title: "Prolific Writer",
                    description: "Posted 10 blogs",
                    icon: "✍️",
                    color: "#4ECDC4",
                    tier: "silver",
                    requirements: { minBlogs: 10 }
                },
                {
                    name: "50-blogs",
                    title: "Content Master",
                    description: "Posted 50 blogs",
                    icon: "🎯",
                    color: "#FFD93D",
                    tier: "gold",
                    requirements: { minBlogs: 50 }
                },
                {
                    name: "100-blogs",
                    title: "Legend",
                    description: "Posted 100 blogs",
                    icon: "👑",
                    color: "#FF6B9D",
                    tier: "platinum",
                    requirements: { minBlogs: 100 }
                },
                {
                    name: "1k-views",
                    title: "Rising Star",
                    description: "Reached 1,000 total views",
                    icon: "⭐",
                    color: "#A8E6CF",
                    tier: "bronze",
                    requirements: { minViews: 1000 }
                },
                {
                    name: "10k-views",
                    title: "Popular Author",
                    description: "Reached 10,000 total views",
                    icon: "🌟",
                    color: "#FFD3B6",
                    tier: "silver",
                    requirements: { minViews: 10000 }
                },
                {
                    name: "100k-views",
                    title: "Viral Sensation",
                    description: "Reached 100,000 total views",
                    icon: "🚀",
                    color: "#FFAAA5",
                    tier: "gold",
                    requirements: { minViews: 100000 }
                },
                {
                    name: "10-followers",
                    title: "Social Butterfly",
                    description: "Gained 10 followers",
                    icon: "🦋",
                    color: "#FF8B94",
                    tier: "bronze",
                    requirements: { minFollowers: 10 }
                },
                {
                    name: "100-followers",
                    title: "Influencer",
                    description: "Gained 100 followers",
                    icon: "📢",
                    color: "#6BCB77",
                    tier: "gold",
                    requirements: { minFollowers: 100 }
                },
                {
                    name: "1k-followers",
                    title: "Celebrity",
                    description: "Gained 1,000 followers",
                    icon: "💎",
                    color: "#FFE66D",
                    tier: "platinum",
                    requirements: { minFollowers: 1000 }
                },
                {
                    name: "100-likes",
                    title: "Loved by Many",
                    description: "Received 100 likes on blogs",
                    icon: "❤️",
                    color: "#FF6B9D",
                    tier: "silver",
                    requirements: { minLikes: 100 }
                },
                {
                    name: "1k-likes",
                    title: "Love Magnet",
                    description: "Received 1,000 likes on blogs",
                    icon: "💗",
                    color: "#C44569",
                    tier: "gold",
                    requirements: { minLikes: 1000 }
                },
                {
                    name: "first-comment",
                    title: "Conversationalist",
                    description: "Posted your first comment",
                    icon: "💬",
                    color: "#5DADE2",
                    tier: "bronze",
                    requirements: { minComments: 1 }
                },
                {
                    name: "100-comments",
                    title: "Voice of Community",
                    description: "Posted 100 comments",
                    icon: "🗣️",
                    color: "#3498DB",
                    tier: "gold",
                    requirements: { minComments: 100 }
                },
                {
                    name: "power-commenter",
                    title: "Power Commenter",
                    description: "Posted 500+ comments",
                    icon: "⚡",
                    color: "#F39C12",
                    tier: "platinum",
                    requirements: { minComments: 500 }
                },
                {
                    name: "early-adopter",
                    title: "Early Adopter",
                    description: "Joined Blogify in the first month",
                    icon: "🎖️",
                    color: "#AF7AC5",
                    tier: "platinum",
                    requirements: { joinedDaysAgo: 30 }
                },
                {
                    name: "trending-author",
                    title: "Trending",
                    description: "Blog appeared in trending section",
                    icon: "🔥",
                    color: "#E74C3C",
                    tier: "gold",
                    requirements: { manualApproval: true }
                },
                {
                    name: "verified-author",
                    title: "Verified",
                    description: "Account verified by admin",
                    icon: "✅",
                    color: "#27AE60",
                    tier: "platinum",
                    requirements: { manualApproval: true }
                }
            ];

            for (const badgeData of badges) {
                await Badge.findOneAndUpdate(
                    { name: badgeData.name },
                    badgeData,
                    { upsert: true, new: true }
                );
            }

            console.log("✅ Default badges initialized successfully");
        } catch (error) {
            console.error("❌ Error initializing badges:", error);
        }
    }

    // ====================== CHECK & AWARD BADGES ======================
    static async checkAndAwardBadges(userId) {
        try {
            const user = await User.findById(userId);
            if (!user) return;

            // Get user stats
            const blogCount = await Blog.countDocuments({ createdBy: userId, isDeleted: false });
            
            const userAnalytics = await require("../models/BlogAnalytics").find({ author: userId });
            const totalViews = userAnalytics.reduce((sum, a) => sum + a.totalViews, 0);
            const totalLikes = userAnalytics.reduce((sum, a) => sum + a.totalLikes, 0);
            
            const followerCount = user.followers ? user.followers.length : 0;
            const commentCount = await Comment.countDocuments({ author: userId, isDeleted: false });
            const joinedDaysAgo = Math.floor((Date.now() - user.createdAt) / (1000 * 60 * 60 * 24));

            // Get all badges
            const badges = await Badge.find({ isActive: true });

            // Check each badge
            for (const badge of badges) {
                const req = badge.requirements;
                let shouldAward = false;

                switch (badge.name) {
                    case "first-blog":
                        shouldAward = blogCount >= 1;
                        break;
                    case "10-blogs":
                        shouldAward = blogCount >= 10;
                        break;
                    case "50-blogs":
                        shouldAward = blogCount >= 50;
                        break;
                    case "100-blogs":
                        shouldAward = blogCount >= 100;
                        break;
                    case "1k-views":
                        shouldAward = totalViews >= 1000;
                        break;
                    case "10k-views":
                        shouldAward = totalViews >= 10000;
                        break;
                    case "100k-views":
                        shouldAward = totalViews >= 100000;
                        break;
                    case "10-followers":
                        shouldAward = followerCount >= 10;
                        break;
                    case "100-followers":
                        shouldAward = followerCount >= 100;
                        break;
                    case "1k-followers":
                        shouldAward = followerCount >= 1000;
                        break;
                    case "100-likes":
                        shouldAward = totalLikes >= 100;
                        break;
                    case "1k-likes":
                        shouldAward = totalLikes >= 1000;
                        break;
                    case "first-comment":
                        shouldAward = commentCount >= 1;
                        break;
                    case "100-comments":
                        shouldAward = commentCount >= 100;
                        break;
                    case "power-commenter":
                        shouldAward = commentCount >= 500;
                        break;
                    case "early-adopter":
                        shouldAward = joinedDaysAgo <= 30;
                        break;
                }

                if (shouldAward) {
                    await this.awardBadge(userId, badge._id);
                }
            }
        } catch (error) {
            console.error("❌ Error checking badges:", error);
        }
    }

    // ====================== AWARD BADGE ======================
    static async awardBadge(userId, badgeId) {
        try {
            const existingBadge = await UserBadge.findOne({
                user: userId,
                badge: badgeId
            });

            if (!existingBadge) {
                const userBadge = await UserBadge.create({
                    user: userId,
                    badge: badgeId,
                    earnedAt: new Date()
                });

                console.log(`✅ Badge awarded to user ${userId}`);
                return userBadge;
            }
        } catch (error) {
            console.error("❌ Error awarding badge:", error);
        }
    }

    // ====================== GET USER BADGES ======================
    static async getUserBadges(userId) {
        try {
            const badges = await UserBadge.find({ user: userId })
                .populate("badge")
                .sort({ earnedAt: -1 })
                .lean();

            return badges;
        } catch (error) {
            console.error("❌ Error getting user badges:", error);
            return [];
        }
    }

    // ====================== GET BADGE PROGRESS ======================
    static async getBadgeProgress(userId) {
        try {
            const user = await User.findById(userId);
            if (!user) return null;

            const blogCount = await Blog.countDocuments({ createdBy: userId, isDeleted: false });
            const userAnalytics = await require("../models/BlogAnalytics").find({ author: userId });
            const totalViews = userAnalytics.reduce((sum, a) => sum + a.totalViews, 0);
            const totalLikes = userAnalytics.reduce((sum, a) => sum + a.totalLikes, 0);
            const followerCount = user.followers ? user.followers.length : 0;
            const commentCount = await Comment.countDocuments({ author: userId, isDeleted: false });

            return {
                blogs: blogCount,
                views: totalViews,
                likes: totalLikes,
                followers: followerCount,
                comments: commentCount
            };
        } catch (error) {
            console.error("❌ Error getting badge progress:", error);
            return null;
        }
    }

    // ====================== GET ALL BADGES (PUBLIC) ======================
    static async getAllBadges() {
        try {
            const badges = await Badge.find({ isActive: true })
                .sort({ tier: 1 })
                .lean();

            return badges;
        } catch (error) {
            console.error("❌ Error getting all badges:", error);
            return [];
        }
    }
}

module.exports = BadgeService;

