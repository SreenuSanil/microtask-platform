const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const WalletTransaction = require("../models/WalletTransaction");

router.get("/my-transactions", protect, async (req, res) => {
  try {
    const transactions = await WalletTransaction.find({
      user: req.user.userId,
    })
      .populate("task", "title")
      .populate("relatedUser", "name")
      .sort({ createdAt: -1 });

    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;