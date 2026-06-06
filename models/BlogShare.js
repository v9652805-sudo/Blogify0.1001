const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const BlogShareSchema = new Schema({
    blog: {
        type: Schema.Types.ObjectId,
        ref: "blog",
        required: true
    },
    
    sharedBy: {
        type: Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    
    // Share platform/method
    platform: {
        type: String,
        enum: ["twitter", "facebook", "linkedin", "whatsapp", "email", "direct-link", "reddit", "other"],
        default: "direct-link"
    },
    
    // Share message
    message: {
        type: String,
        maxlength: 500,
        default: ""
    },
    
    // Tracking data
    shareUrl: String,
    referralCode: String,
    
    // Track conversions
    clickCount: { type: Number, default: 0 },
    conversions: {
        views: { type: Number, default: 0 },
        likes: { type: Number, default: 0 },
        comments: { type: Number, default: 0 },
        shares: { type: Number, default: 0 }
    },
    
    // Engagement metrics
    engagement: {
        lastClicked: Date,
        clickedBy: [{
            user: { type: Schema.Types.ObjectId, ref: "user" },
            clickedAt: Date,
            userAgent: String,
            ip: String
        }]
    },
    
}, { timestamps: true });

// Indexes
BlogShareSchema.index({ blog: 1, createdAt: -1 });
BlogShareSchema.index({ sharedBy: 1, createdAt: -1 });
BlogShareSchema.index({ platform: 1 });
BlogShareSchema.index({ referralCode: 1 }, { sparse: true });

// Static method to generate referral code
BlogShareSchema.statics.generateReferralCode = function(blogId, userId) {
    return `${blogId.toString().substring(0, 8)}_${userId.toString().substring(0, 8)}_${Date.now().toString(36)}`;
};

const BlogShare = mongoose.models.BlogShare || model("BlogShare", BlogShareSchema);
module.exports = BlogShare;
