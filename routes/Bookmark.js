const express = require("express");
const router = express.Router();
const { restrictToLoggedInUserOnly } = require("../middlewares/authentication");
const BookmarkService = require("../services/bookmarkService");
const Bookmark = require("../models/Bookmark");

router.use(restrictToLoggedInUserOnly);

// ====================== CREATE BOOKMARK ======================
router.post("/blog/:blogId", async (req, res) => {
    try {
        const { blogId } = req.params;
        const { collection = "default" } = req.body;

        const result = await BookmarkService.createBookmark(
            req.user._id,
            blogId,
            collection
        );

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error("Error creating bookmark:", error);
        res.status(500).json({ success: false, message: "Failed to bookmark blog" });
    }
});

// ====================== GET USER BOOKMARKS ======================
router.get("/", async (req, res) => {
    try {
        const { collection, isRead, page = 1 } = req.query;
        const limit = 12;
        const skip = (page - 1) * limit;

        const bookmarks = await BookmarkService.getUserBookmarks(
            req.user._id,
            collection || null,
            isRead ? isRead === "true" : null
        );

        const paginated = bookmarks.slice(skip, skip + limit);
        const total = bookmarks.length;

        res.json({
            success: true,
            bookmarks: paginated,
            total,
            pages: Math.ceil(total / limit),
            currentPage: parseInt(page)
        });
    } catch (error) {
        console.error("Error getting bookmarks:", error);
        res.status(500).json({ success: false, message: "Failed to fetch bookmarks" });
    }
});

// ====================== GET BOOKMARK COLLECTIONS ======================
router.get("/collections", async (req, res) => {
    try {
        const collections = await BookmarkService.getUserCollections(req.user._id);
        res.json({ success: true, collections });
    } catch (error) {
        console.error("Error getting collections:", error);
        res.status(500).json({ success: false, message: "Failed to fetch collections" });
    }
});

// ====================== GET READING STATS ======================
router.get("/stats", async (req, res) => {
    try {
        const stats = await BookmarkService.getReadingStats(req.user._id);
        res.json({ success: true, stats });
    } catch (error) {
        console.error("Error getting reading stats:", error);
        res.status(500).json({ success: false, message: "Failed to fetch reading stats" });
    }
});

// ====================== UPDATE BOOKMARK ======================
router.put("/:bookmarkId", async (req, res) => {
    try {
        const { bookmarkId } = req.params;
        const result = await BookmarkService.updateBookmark(
            bookmarkId,
            req.user._id,
            req.body
        );

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error("Error updating bookmark:", error);
        res.status(500).json({ success: false, message: "Failed to update bookmark" });
    }
});

// ====================== DELETE BOOKMARK ======================
router.delete("/:bookmarkId", async (req, res) => {
    try {
        const { bookmarkId } = req.params;
        const result = await BookmarkService.deleteBookmark(bookmarkId, req.user._id);

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error("Error deleting bookmark:", error);
        res.status(500).json({ success: false, message: "Failed to delete bookmark" });
    }
});

// ====================== ADD HIGHLIGHT ======================
router.post("/:bookmarkId/highlight", async (req, res) => {
    try {
        const { bookmarkId } = req.params;
        const result = await BookmarkService.addHighlight(
            bookmarkId,
            req.user._id,
            req.body
        );

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error("Error adding highlight:", error);
        res.status(500).json({ success: false, message: "Failed to add highlight" });
    }
});

// ====================== CHECK IF BOOKMARKED ======================
router.get("/check/:blogId", async (req, res) => {
    try {
        const { blogId } = req.params;
        const isBookmarked = await BookmarkService.isBookmarked(req.user._id, blogId);
        res.json({ success: true, isBookmarked });
    } catch (error) {
        console.error("Error checking bookmark:", error);
        res.status(500).json({ success: false, message: "Failed to check bookmark" });
    }
});

module.exports = router;

