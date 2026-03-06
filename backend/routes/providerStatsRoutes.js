const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");

const Task = require("../models/Task");
const WalletTransaction = require("../models/WalletTransaction");

router.get("/overview", protect, async (req, res) => {
  try {
    const providerId = req.user.userId;

    // Run independent queries in parallel
    const [
      taskStats,
      walletSummary,
      recentActivity
    ] = await Promise.all([

      // TASK AGGREGATION (1 query instead of 3)
      Task.aggregate([
        { $match: { provider: providerId } },
        {
          $group: {
            _id: null,
            totalTasks: { $sum: 1 },
            activeTasks: {
              $sum: {
                $cond: [
                  { $in: ["$status", ["assigned", "in_progress"]] },
                  1,
                  0
                ]
              }
            },
            completedTasks: {
              $sum: {
                $cond: [{ $eq: ["$status", "completed"] }, 1, 0]
              }
            }
          }
        }
      ]),

      // WALLET SUMMARY (1 aggregation instead of 4)
      WalletTransaction.aggregate([
        { $match: { user: providerId } },
        {
          $group: {
            _id: null,
            totalSpent: {
              $sum: {
                $cond: [
                  { $eq: ["$type", "escrow_payment"] },
                  "$amount",
                  0
                ]
              }
            },
            refunds: {
              $sum: {
                $cond: [{ $eq: ["$type", "refund"] }, "$amount", 0]
              }
            },
            commission: {
              $sum: {
                $cond: [{ $eq: ["$type", "commission"] }, "$amount", 0]
              }
            }
          }
        }
      ]),

      // RECENT ACTIVITY
      WalletTransaction.find({ user: providerId })
        .populate("task", "title")
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    const stats = taskStats[0] || {};
    const wallet = walletSummary[0] || {};

    res.json({
      totalTasks: stats.totalTasks || 0,
      activeTasks: stats.activeTasks || 0,
      completedTasks: stats.completedTasks || 0,
      totalSpent: wallet.totalSpent || 0,
      escrowLocked: wallet.totalSpent || 0,
      refunds: wallet.refunds || 0,
      commission: wallet.commission || 0,
      recentActivity
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;