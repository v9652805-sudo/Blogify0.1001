const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const BadgeSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        enum: [
            "first-blog",           // Posted first blog
            "10-blogs",             // Posted 10 blogs
            "50-blogs",             // Posted 50 blogs
            "100-blogs",            // Posted 100 blogs
            "1k-views",             // Blog received 1k views
            "10k-views",            // Blog received 10k views
            "100k-views",           // Blog received 100k views
            "10-followers",         // Got 10 followers
            "100-followers",        // Got 100 followers
            "1k-followers",         // Got 1k followers
            "first-like",           // Got first like
            "100-likes",            // Got 100 likes on blogs
            "1k-likes",             // Got 1k likes on blogs
            "first-comment",        // Got first comment
            "100-comments",         // Got 100 comments
            "helpful-writer",       // Consistent engagement
            "trending-author",      // Blog hit trending
            "top-writer",           // In top 10 authors
            "power-commenter",      // 100+ comments written
            "social-butterfly",     // Shared blogs 50+ times
            "week-streak",          // Posted 7 days in a row
            "month-streak",         // Posted in 30 consecutive days
            "verified-author",      // Manually verified
            "early-adopter",        // Joined in first month
            "community-leader"      // High engagement & followers
        ]
    },
    
    title: String,
    
    description: {
        type: String,
        required: true
    },
    
    // Badge icon/image
    icon: String,
    color: String,
    
    // Requirements
    requirements: {
        minBlogs: { type: Number, default: 0 },
        minViews: { type: Number, default: 0 },
        minFollowers: { type: Number, default: 0 },
        minLikes: { type: Number, default: 0 },
        minComments: { type: Number, default: 0 },
        minShares: { type: Number, default: 0 },
        joinedDaysAgo: { type: Number, default: null },
        manualApproval: { type: Boolean, default: false }
    },
    
    // Badge tier
    tier: {
        type: String,
        enum: ["bronze", "silver", "gold", "platinum"],
        default: "bronze"
    },
    
    // Visibility
    isActive: { type: Boolean, default: true },
    
}, { timestamps: true });

const UserBadgeSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    
    badge: {
        type: Schema.Types.ObjectId,
        ref: "Badge",
        required: true
    },
    
    earnedAt: {
        type: Date,
        default: Date.now
    },
    
    // Display on profile
    featured: { type: Boolean, default: false },
    
    // Progress tracking
    progress: {
        current: { type: Number, default: 0 },
        required: { type: Number, default: 100 }
    }
    
}, { timestamps: true });

UserBadgeSchema.index({ user: 1, badge: 1 }, { unique: true });
UserBadgeSchema.index({ user: 1, earnedAt: -1 });

const Badge = mongoose.models.Badge || model("Badge", BadgeSchema);
const UserBadge = mongoose.models.UserBadge || model("UserBadge", UserBadgeSchema);

module.exports = { Badge, UserBadge };
