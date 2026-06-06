const BlogShare = require("../models/BlogShare");
const crypto = require("crypto");

class ShareAnalyticsService {
    
    // ====================== CREATE SHARE TRACKING ======================
    static async createShare(blogId, userId, platform, message = "") {
        try {
            const referralCode = BlogShare.generateReferralCode(blogId, userId);
            
            const share = await BlogShare.create({
                blog: blogId,
                sharedBy: userId,
                platform,
                message,
                referralCode,
                shareUrl: `${process.env.APP_URL}/blogs/${blogId}?ref=${referralCode}`
            });

            return {
                success: true,
                share,
                trackingUrl: share.shareUrl
            };
        } catch (error) {
            console.error("❌ Error creating share:", error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    // ====================== TRACK SHARE CLICK ======================
    static async trackShareClick(referralCode, userId = null, userAgent = "", ip = "") {
        try {
            const share = await BlogShare.findOne({ referralCode });
            
            if (!share) {
                return {
                    success: false,
                    message: "Invalid referral code"
                };
            }

            share.clickCount += 1;
            share.engagement.lastClicked = new Date();
            
            share.engagement.clickedBy.push({
                user: userId,
                clickedAt: new Date(),
                userAgent,
                ip
            });

            share.conversions.views += 1;

            await share.save();

            return {
                success: true,
                message: "Share click tracked"
            };
        } catch (error) {
            console.error("❌ Error tracking share click:", error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    // ====================== GET BLOG SHARE STATS ======================
    static async getBlogShareStats(blogId) {
        try {
            const shares = await BlogShare.find({ blog: blogId });
            
            if (shares.length === 0) {
                return {
                    totalShares: 0,
                    totalClicks: 0,
                    platforms: {},
                    topPerformers: [],
                    conversions: { views: 0, likes: 0, comments: 0, shares: 0 }
                };
            }

            const platformStats = {};
            let totalClicks = 0;

            shares.forEach(share => {
                totalClicks += share.clickCount;
                
                if (!platformStats[share.platform]) {
                    platformStats[share.platform] = {
                        count: 0,
                        clicks: 0,
                        conversions: { views: 0, likes: 0, comments: 0, shares: 0 }
                    };
                }
                
                platformStats[share.platform].count += 1;
                platformStats[share.platform].clicks += share.clickCount;
                platformStats[share.platform].conversions.views += share.conversions.views;
                platformStats[share.platform].conversions.likes += share.conversions.likes;
                platformStats[share.platform].conversions.comments += share.conversions.comments;
                platformStats[share.platform].conversions.shares += share.conversions.shares;
            });

            const totalConversions = shares.reduce((acc, share) => {
                acc.views += share.conversions.views;
                acc.likes += share.conversions.likes;
                acc.comments += share.conversions.comments;
                acc.shares += share.conversions.shares;
                return acc;
            }, { views: 0, likes: 0, comments: 0, shares: 0 });

            const topPerformers = await BlogShare.find({ blog: blogId })
                .populate("sharedBy", "fullName profileImageURL")
                .sort({ clickCount: -1 })
                .limit(5)
                .lean();

            return {
                totalShares: shares.length,
                totalClicks,
                platforms: platformStats,
                topPerformers,
                conversions: totalConversions,
                avgClicksPerShare: shares.length > 0 ? (totalClicks / shares.length).toFixed(2) : 0
            };
        } catch (error) {
            console.error("❌ Error getting blog share stats:", error);
            return null;
        }
    }

    // ====================== GET USER SHARE STATS ======================
    static async getUserShareStats(userId) {
        try {
            const shares = await BlogShare.find({ sharedBy: userId })
                .populate("blog", "title slug")
                .sort({ createdAt: -1 });

            const totalShares = shares.length;
            const totalClicks = shares.reduce((sum, s) => sum + s.clickCount, 0);
            const totalConversions = shares.reduce((acc, s) => {
                acc.views += s.conversions.views;
                acc.likes += s.conversions.likes;
                acc.comments += s.conversions.comments;
                acc.shares += s.conversions.shares;
                return acc;
            }, { views: 0, likes: 0, comments: 0, shares: 0 });

            const platformStats = {};
            shares.forEach(share => {
                if (!platformStats[share.platform]) {
                    platformStats[share.platform] = 0;
                }
                platformStats[share.platform] += 1;
            });

            return {
                totalShares,
                totalClicks,
                totalConversions,
                platformStats,
                shares,
                avgEngagementRate: totalShares > 0 ? ((totalClicks / totalShares) * 100).toFixed(2) : 0
            };
        } catch (error) {
            console.error("❌ Error getting user share stats:", error);
            return null;
        }
    }

    // ====================== UPDATE SHARE CONVERSIONS ======================
    static async updateShareConversions(referralCode, conversionType) {
        try {
            const share = await BlogShare.findOne({ referralCode });
            
            if (!share) return;

            if (["views", "likes", "comments", "shares"].includes(conversionType)) {
                share.conversions[conversionType] += 1;
                await share.save();
            }
        } catch (error) {
            console.error("❌ Error updating share conversions:", error);
        }
    }

    // ====================== GET TOP SHARED BLOGS ======================
    static async getTopSharedBlogs(limit = 10) {
        try {
            const topShared = await BlogShare.aggregate([
                {
                    $group: {
                        _id: "$blog",
                        totalShares: { $sum: 1 },
                        totalClicks: { $sum: "$clickCount" },
                        avgRating: { $avg: "$conversions.likes" }
                    }
                },
                {
                    $sort: { totalShares: -1 }
                },
                {
                    $limit: limit
                },
                {
                    $lookup: {
                        from: "blogs",
                        localField: "_id",
                        foreignField: "_id",
                        as: "blogData"
                    }
                }
            ]);

            return topShared;
        } catch (error) {
            console.error("❌ Error getting top shared blogs:", error);
            return [];
        }
    }

    // ====================== GET SHARE PERFORMANCE ======================
    static async getSharePerformance(blogId, days = 30) {
        try {
            const dateFilter = new Date();
            dateFilter.setDate(dateFilter.getDate() - days);

            const shares = await BlogShare.find({
                blog: blogId,
                createdAt: { $gte: dateFilter }
            });

            const performanceByDay = {};
            
            shares.forEach(share => {
                const day = share.createdAt.toLocaleDateString();
                if (!performanceByDay[day]) {
                    performanceByDay[day] = {
                        shares: 0,
                        clicks: 0,
                        conversions: { views: 0, likes: 0, comments: 0, shares: 0 }
                    };
                }
                
                performanceByDay[day].shares += 1;
                performanceByDay[day].clicks += share.clickCount;
                performanceByDay[day].conversions.views += share.conversions.views;
                performanceByDay[day].conversions.likes += share.conversions.likes;
                performanceByDay[day].conversions.comments += share.conversions.comments;
                performanceByDay[day].conversions.shares += share.conversions.shares;
            });

            return performanceByDay;
        } catch (error) {
            console.error("❌ Error getting share performance:", error);
            return {};
        }
    }
}

module.exports = ShareAnalyticsService;
