const BlogAnalytics = require("../models/BlogAnalytics");
const Blog = require("../models/Blog");

class AnalyticsService {
    // Track blog view — analytics counters only.
    // viewCount on the Blog document is managed exclusively by routes/Blog.js
    // GET /:id to avoid double-counting.
    static async trackView(blogId, userId, source = "direct") {
        try {
            // ✅ FIX: Removed Blog.findByIdAndUpdate({ $inc: { viewCount: 1 } }) that
            // was here before. The route handler already increments viewCount after the
            // 24h deduplication check. Calling it here too was doubling every view count.

            let analytics = await BlogAnalytics.findOne({ blog: blogId });

            if (!analytics) {
                const blog = await Blog.findById(blogId);
                if (!blog) return; // Guard against race condition on deleted blogs
                analytics = await BlogAnalytics.create({
                    blog: blogId,
                    author: blog.createdBy
                });
            }

            analytics.totalViews += 1;

            // Track traffic source
            const validSources = ["direct", "search", "social", "referral"];
            if (validSources.includes(source)) {
                analytics.viewSource[source] += 1;
            }

            // Track daily views
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const dailyViewIndex = analytics.dailyViews.findIndex(
                dv => new Date(dv.date).getTime() === today.getTime()
            );

            if (dailyViewIndex >= 0) {
                analytics.dailyViews[dailyViewIndex].count += 1;
            } else {
                analytics.dailyViews.push({ date: today, count: 1 });
            }

            await analytics.save();
        } catch (error) {
            console.error("❌ Error tracking view:", error);
        }
    }

    // Get blog analytics
    static async getBlogAnalytics(blogId) {
        try {
            const analytics = await BlogAnalytics.findOne({ blog: blogId })
                .populate("blog", "title viewCount")
                .populate("author", "fullName");

            return analytics || null;
        } catch (error) {
            console.error("❌ Error getting analytics:", error);
            return null;
        }
    }

    // Get author analytics
    static async getAuthorAnalytics(userId) {
        try {
            const analytics = await BlogAnalytics.find({ author: userId })
                .populate("blog", "title viewCount");

            const totalStats = {
                totalViews: 0,
                totalLikes: 0,
                totalComments: 0,
                totalBlogs: analytics.length,
                topBlog: null,
                maxViews: 0
            };

            analytics.forEach(stat => {
                totalStats.totalViews += stat.totalViews;
                totalStats.totalLikes += stat.totalLikes;
                totalStats.totalComments += stat.totalComments;

                if (stat.totalViews > totalStats.maxViews) {
                    totalStats.maxViews = stat.totalViews;
                    totalStats.topBlog = stat.blog;
                }
            });

            return totalStats;
        } catch (error) {
            console.error("❌ Error getting author analytics:", error);
            return null;
        }
    }

    // Get trending blogs
    static async getTrendingBlogs(limit = 5) {
        try {
            const trendingBlogs = await BlogAnalytics.find()
                .sort({ totalViews: -1 })
                .limit(limit)
                .populate("blog", "title slug coverImageURL createdAt")
                .populate("author", "fullName profileImageURL");

            return trendingBlogs;
        } catch (error) {
            console.error("❌ Error getting trending blogs:", error);
            return [];
        }
    }

    // Get most liked blogs
    static async getMostLikedBlogs(limit = 5) {
        try {
            const blogs = await BlogAnalytics.find()
                .sort({ totalLikes: -1 })
                .limit(limit)
                .populate("blog", "title slug coverImageURL")
                .populate("author", "fullName profileImageURL");

            return blogs;
        } catch (error) {
            console.error("❌ Error getting most liked blogs:", error);
            return [];
        }
    }
}

module.exports = AnalyticsService;
