const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const BookmarkSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    
    blog: {
        type: Schema.Types.ObjectId,
        ref: "blog",
        required: true
    },
    
    // Collections/Lists for organizing bookmarks
    collection: {
        type: String,
        default: "default",
        enum: ["default", "to-read", "favorites", "research", "inspiration", "custom"]
    },
    
    // Notes on the bookmark
    notes: {
        type: String,
        default: "",
        maxlength: 500
    },
    
    // Reading progress
    readingProgress: {
        isRead: { type: Boolean, default: false },
        readAt: { type: Date, default: null },
        readingTime: { type: Number, default: 0 } // minutes spent reading
    },
    
    // Rating
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    },
    
    // Highlight important parts
    highlights: [{
        text: String,
        color: { type: String, default: "yellow" },
        position: Number,
        highlightedAt: { type: Date, default: Date.now }
    }],
    
}, { timestamps: true });

// Indexes for faster queries
BookmarkSchema.index({ user: 1, blog: 1 }, { unique: true });
BookmarkSchema.index({ user: 1, createdAt: -1 });
BookmarkSchema.index({ user: 1, collection: 1 });
BookmarkSchema.index({ user: 1, readingProgress.isRead: 1 });

// Virtual for formatted created date
BookmarkSchema.virtual("formattedDate").get(function() {
    return new Date(this.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
});

const Bookmark = mongoose.models.Bookmark || model("Bookmark", BookmarkSchema);
module.exports = Bookmark;
