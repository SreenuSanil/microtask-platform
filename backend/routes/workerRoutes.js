const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const {
  getMyNotifications,
} = require("../controllers/workerController");

// notifications
router.get("/notifications", auth, getMyNotifications);

module.exports = router;
