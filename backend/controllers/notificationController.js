const Notification = require("../models/Notification");

// 🔔 Get Notifications
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      userId: req.user.userId, // use correct field
    }).sort({ createdAt: -1 });

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};

// 🔔 Mark All As Read
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.userId, read: false },
      { read: true }
    );

    res.json({ message: "Notifications marked as read" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update notifications" });
  }
};

// 🔔 Create Notification (Reusable)
const createNotification = async ({
  userId,
  title,
  message,
}) => {
  try {
    await Notification.create({
      userId,
      title,
      message,
    });
  } catch (err) {
    console.error("Notification creation failed");
  }
};

module.exports = {
  getNotifications,
  markAllAsRead,
  createNotification,
};
