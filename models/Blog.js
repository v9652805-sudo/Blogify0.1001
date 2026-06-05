const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const BlogSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    body: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        unique: true,
        sparse: true
    },
    excerpt: {
        type: String,
        default: ""
    },
    metaDescription: {
        type: String,
        default: ""
    },
    coverImageURL: {
        type: String,
        default: null
    },
    tags: [{
        type: String,
        trim: true
    }],
    category: {
        type: String,
        default: "General"
    },
    status: {
        type: String,
        enum: ["published", "draft"],
        default: "published"
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "user",
        required: true
    },

    // ====================== SOFT DELETE ======================
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date,
        default: null
    },

    // ====================== FEATURED ======================
    isFeatured: {
        type: Boolean,
        default: false
    },
    featuredRank: {
        type: Number,
        default: 0
    },

    // ====================== ENGAGEMENT ======================
    viewCount: {
        type: Number,
        default: 0
    },
    likes: [{
        type: Schema.Types.ObjectId,
        ref: "user"
    }],
    readingTime: {
        type: Number,
        default: 0
    },

    // ====================== VIEW DEDUPLICATION ======================
    // Stores one entry per unique viewer (identified by user ID or IP fingerprint).
    // The route handler uses $elemMatch to check if a viewer has an entry
    // with viewedAt >= 24h ago before counting a new view.
    // $pull removes the stale entry, $push adds a fresh one — so the array
    // stays bounded to one entry per unique viewer.
    viewers: [
        {
            viewerId:        { type: String,  required: true },
            viewedAt:        { type: Date,    required: true },
            isAuthenticated: { type: Boolean, default: false }
        }
    ]

}, { timestamps: true });

// ====================== QUERY HELPERS ======================
// Used as Blog.find(...).notDeleted() throughout the routes
BlogSchema.query.notDeleted = function () {
    return this.where({ isDeleted: false });
};

// ====================== INDEXES ======================
BlogSchema.index({ createdBy: 1, createdAt: -1 });
BlogSchema.index({ tags: 1 });
BlogSchema.index({ status: 1, isDeleted: 1, createdAt: -1 });
BlogSchema.index({ isFeatured: 1, featuredRank: 1 });
BlogSchema.index({ viewCount: -1 });
// Compound index for the $elemMatch deduplication query in GET /:id
BlogSchema.index({ "viewers.viewerId": 1, "viewers.viewedAt": 1 });

// ====================== PRE-SAVE HOOKS ======================
// Auto-calculate reading time whenever the body changes
BlogSchema.pre("save", function (next) {
    if (this.isModified("body")) {
        const wordsPerMinute = 200;
        const wordCount = this.body.trim().split(/\s+/).length;
        this.readingTime = Math.ceil(wordCount / wordsPerMinute);
    }
    next();
});

// ====================== MODEL ======================
const Blog = mongoose.models.blog || model("blog", BlogSchema);
module.exports = Blog;
