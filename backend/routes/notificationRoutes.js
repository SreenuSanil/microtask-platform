const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { getUnreadCount } = require("../controllers/notificationController");
const {
  getNotifications,
  markAllAsRead,
} = require("../controllers/notificationController");

router.get("/", protect, getNotifications);
router.patch("/read", protect, markAllAsRead);
router.get("/unread-count", protect, getUnreadCount);
module.exports = router;
