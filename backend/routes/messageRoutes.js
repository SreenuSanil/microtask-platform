const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const Message = require("../models/Message");
const Connection = require("../models/Connection");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/chat/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });
router.get("/unread-count", auth, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      isRead: false,
      sender: { $ne: req.user.userId },
    });

    res.json({ totalUnread: count });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});
// Get chat history
router.get("/:connectionId", auth, async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.connectionId);
     
    if (!connection) {
      return res.status(404).json({ message: "Connection not found" });
    }

    // 🔒 Allow only provider or worker to see this chat
    if (
  connection.provider.toString() !== req.user.userId.toString() &&
  connection.worker.toString() !== req.user.userId.toString()
)
 {
      return res.status(403).json({ message: "Unauthorized" });
    }

const result = await Message.updateMany(
{
  connection: req.params.connectionId,
  sender: { $ne: req.user.userId },
  isRead: false,
},
{ $set: { isRead: true } }
);

// 🔥 If messages were updated, notify user to refresh unread count
if (result.modifiedCount > 0) {
  const io = req.app.get("io");
  io.to(req.user.userId.toString()).emit("refresh_unread");
}

    const messages = await Message.find({
      connection: req.params.connectionId,
    })
    .populate("sender", "_id name")
      .sort({ createdAt: 1 })   
     
      
res.json({
  messages,
  status: connection.status,
  budgetConfirmed: connection.budgetConfirmed,
   isProvider: connection.provider.toString() === req.user.userId.toString()
});


  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});



// 📷 Upload Chat Image
router.post(
  "/image/:connectionId",
  auth,
  upload.single("image"),
  async (req, res) => {
    try {
      const connection = await Connection.findById(
        req.params.connectionId
      );

      if (!connection) {
        return res.status(404).json({ message: "Connection not found" });
      }

      const newMessage = await Message.create({
        connection: req.params.connectionId,
        sender: req.user.userId,
        type: "image",
        imageUrl: req.file.path.replace(/\\/g, "/"),

      });

      const populatedMessage = await Message.findById(newMessage._id)
  .populate("sender", "_id name");

res.json(populatedMessage);
    } catch (err) {
      res.status(500).json({ message: "Upload failed" });
    }
  }
);

// 🎤 Upload Voice Message
router.post(
  "/voice/:connectionId",
  auth,
  upload.single("voice"),
  async (req, res) => {
    try {
      const newMessage = await Message.create({
        connection: req.params.connectionId,
        sender: req.user.userId,
        type: "voice",
        voiceUrl: req.file.path.replace(/\\/g, "/"),

      });

      res.json(newMessage);
    } catch (err) {
      res.status(500).json({ message: "Voice upload failed" });
    }
  }
);

module.exports = router;
