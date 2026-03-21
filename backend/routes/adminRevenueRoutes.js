const express = require("express");
const router = express.Router();
const WalletTransaction = require("../models/WalletTransaction");
const protect = require("../middleware/authMiddleware");

/* =========================
   REVENUE SUMMARY
========================= */

router.get("/summary", protect, async (req, res) => {

  try {

    const commissions = await WalletTransaction.find({
      type: "commission"
    });

    const totalRevenue = commissions.reduce(
      (sum, txn) => sum + txn.amount,
      0
    );

    const totalTasks = commissions.length;

    const totalPayments = await WalletTransaction.aggregate([
      {
        $match: { type: "escrow_payment" }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" }
        }
      }
    ]);

    res.json({
      totalRevenue,
      totalTasks,
      totalPayments: totalPayments[0]?.total || 0
    });

  } catch (err) {

    res.status(500).json({
      message: "Failed to fetch revenue summary"
    });

  }

});


/* =========================
   MONTHLY REVENUE
========================= */

router.get("/monthly", protect, async (req, res) => {

  try {

    const revenue = await WalletTransaction.aggregate([

      {
        $match: { type: "commission" }
      },

      {
        $group: {
          _id: {
            month: { $month: "$createdAt" }
          },
          total: { $sum: "$amount" }
        }
      },

      {
        $sort: { "_id.month": 1 }
      }

    ]);

    res.json(revenue);

  } catch (err) {

    res.status(500).json({
      message: "Failed to fetch monthly revenue"
    });

  }

});


/* =========================
   REVENUE TRANSACTIONS
========================= */

router.get("/transactions", protect, async (req, res) => {

  try {

    const txns = await WalletTransaction.find({
      type: "commission"
    })
      .populate("task", "title")
      .populate("user", "name")
      .populate("relatedUser", "name")
      .sort({ createdAt: -1 });

    res.json(txns);

  } catch (err) {

    res.status(500).json({
      message: "Failed to fetch transactions"
    });

  }

});

module.exports = router;