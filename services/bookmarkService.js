const Bookmark = require("../models/Bookmark");
const Blog = require("../models/Blog");

class BookmarkService {
    
    // ====================== CREATE BOOKMARK ======================
    static async createBookmark(userId, blogId, collection = "default") {
        try {
            // Check if bookmark already exists
            const existingBookmark = await Bookmark.findOne({
                user: userId,
                blog: blogId
            });

            if (existingBookmark) {
                return {
                    success: false,
                    message: "Blog already bookmarked",
                    bookmark: existingBookmark
                };
            }

            // Check if blog exists
            const blog = await Blog.findById(blogId);
            if (!blog) {
                return {
                    success: false,
                    message: "Blog not found"
                };
            }

            const bookmark = await Bookmark.create({
                user: userId,
                blog: blogId,
                collection
            });

            return {
                success: true,
                message: "Blog bookmarked successfully",
                bookmark
            };
        } catch (error) {
            console.error("❌ Error creating bookmark:", error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    // ====================== GET USER BOOKMARKS ======================
    static async getUserBookmarks(userId, collection = null, isRead = null) {
        try {
            const filter = { user: userId };
            
            if (collection) filter.collection = collection;
            if (isRead !== null) filter["readingProgress.isRead"] = isRead;

            const bookmarks = await Bookmark.find(filter)
                .populate("blog", "title slug coverImageURL createdBy readingTime")
                .populate("blog.createdBy", "fullName profileImageURL")
                .sort({ createdAt: -1 })
                .lean();

            return bookmarks;
        } catch (error) {
            console.error("❌ Error getting bookmarks:", error);
            return [];
        }
    }

    // ====================== GET BOOKMARK COLLECTIONS ======================
    static async getUserCollections(userId) {
        try {
            const collections = await Bookmark.distinct("collection", { user: userId });
            
            const collectionsWithCount = await Promise.all(
                collections.map(async (collection) => {
                    const count = await Bookmark.countDocuments({
                        user: userId,
                        collection
                    });
                    return { name: collection, count };
                })
            );

            return collectionsWithCount;
        } catch (error) {
            console.error("❌ Error getting collections:", error);
            return [];
        }
    }

    // ====================== UPDATE BOOKMARK ======================
    static async updateBookmark(bookmarkId, userId, updateData) {
        try {
            const bookmark = await Bookmark.findById(bookmarkId);
            
            if (!bookmark) {
                return {
                    success: false,
                    message: "Bookmark not found"
                };
            }

            // Verify ownership
            if (bookmark.user.toString() !== userId.toString()) {
                return {
                    success: false,
                    message: "Not authorized"
                };
            }

            // Update allowed fields
            if (updateData.collection) bookmark.collection = updateData.collection;
            if (updateData.notes !== undefined) bookmark.notes = updateData.notes;
            if (updateData.rating !== undefined) bookmark.rating = Math.min(5, Math.max(0, updateData.rating));
            
            if (updateData.isRead !== undefined) {
                bookmark.readingProgress.isRead = updateData.isRead;
                if (updateData.isRead) {
                    bookmark.readingProgress.readAt = new Date();
                }
            }

            await bookmark.save();

            return {
                success: true,
                message: "Bookmark updated successfully",
                bookmark
            };
        } catch (error) {
            console.error("❌ Error updating bookmark:", error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    // ====================== DELETE BOOKMARK ======================
    static async deleteBookmark(bookmarkId, userId) {
        try {
            const bookmark = await Bookmark.findById(bookmarkId);
            
            if (!bookmark) {
                return {
                    success: false,
                    message: "Bookmark not found"
                };
            }

            // Verify ownership
            if (bookmark.user.toString() !== userId.toString()) {
                return {
                    success: false,
                    message: "Not authorized"
                };
            }

            await Bookmark.findByIdAndDelete(bookmarkId);

            return {
                success: true,
                message: "Bookmark deleted successfully"
            };
        } catch (error) {
            console.error("❌ Error deleting bookmark:", error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    // ====================== ADD HIGHLIGHT ======================
    static async addHighlight(bookmarkId, userId, highlightData) {
        try {
            const bookmark = await Bookmark.findById(bookmarkId);
            
            if (!bookmark || bookmark.user.toString() !== userId.toString()) {
                return {
                    success: false,
                    message: "Not authorized"
                };
            }

            bookmark.highlights.push({
                text: highlightData.text,
                color: highlightData.color || "yellow",
                position: highlightData.position
            });

            await bookmark.save();

            return {
                success: true,
                message: "Highlight added successfully",
                bookmark
            };
        } catch (error) {
            console.error("❌ Error adding highlight:", error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    // ====================== GET READING STATS ======================
    static async getReadingStats(userId) {
        try {
            const total = await Bookmark.countDocuments({ user: userId });
            const read = await Bookmark.countDocuments({
                user: userId,
                "readingProgress.isRead": true
            });
            const unread = total - read;
            const avgRating = await Bookmark.aggregate([
                { $match: { user: require("mongoose").Types.ObjectId(userId) } },
                { $group: { _id: null, avgRating: { $avg: "$rating" } } }
            ]);

            return {
                total,
                read,
                unread,
                readingPercentage: total > 0 ? Math.round((read / total) * 100) : 0,
                averageRating: avgRating.length > 0 ? avgRating[0].avgRating.toFixed(1) : 0
            };
        } catch (error) {
            console.error("❌ Error getting reading stats:", error);
            return null;
        }
    }

    // ====================== IS BOOKMARKED ======================
    static async isBookmarked(userId, blogId) {
        try {
            const bookmark = await Bookmark.findOne({
                user: userId,
                blog: blogId
            });

            return !!bookmark;
        } catch (error) {
            console.error("❌ Error checking bookmark:", error);
            return false;
        }
    }
}

module.exports = BookmarkService;
