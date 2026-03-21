const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");

const WalletTransaction = require("../models/WalletTransaction");
const Settings = require("../models/Settings");
/* ======================================
   GET ALL TRANSACTIONS (existing)
====================================== */

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


/* ======================================
   WORKER WALLET SUMMARY
====================================== */

router.get("/worker-summary", protect, async (req, res) => {

  try {

    const userId = req.user.userId;

    const transactions = await WalletTransaction.find({
      user: userId
    });

    let totalEarnings = 0;
    let withdrawals = 0;

    transactions.forEach(txn => {

      if (
  txn.type === "worker_earning" ||
  txn.type === "task_payment_release"
) {
  totalEarnings += txn.amount;
}

      if (txn.type === "withdrawal") {
        withdrawals += txn.amount;
      }

    });

    const walletBalance = totalEarnings - withdrawals;

    res.json({
      walletBalance,
      totalEarnings,
      withdrawals
    });

  } catch (err) {

    res.status(500).json({
      message: "Failed to fetch wallet summary"
    });

  }

});


/* ======================================
   WORKER WITHDRAW MONEY
====================================== */

router.post("/withdraw", protect, async (req, res) => {

  try {

    const userId = req.user.userId;
    const { amount } = req.body;

    const settings = await Settings.findOne();

if (amount < settings.minWithdrawal) {
  return res.status(400).json({
    message: `Minimum withdrawal is ₹${settings.minWithdrawal}`
  });
}

    if (!amount || amount <= 0) {

      return res.status(400).json({
        message: "Invalid amount"
      });

    }

    const transactions = await WalletTransaction.find({
      user: userId
    });

    let earnings = 0;
    let withdrawals = 0;

  transactions.forEach(txn => {

  if (
    txn.type === "worker_earning" ||
    txn.type === "task_payment_release"
  ) {
    earnings += txn.amount;
  }

  if (txn.type === "withdrawal") {
    withdrawals += txn.amount;
  }

});

    const balance = earnings - withdrawals;

    if (amount > balance) {

      return res.status(400).json({
        message: "Insufficient wallet balance"
      });

    }

    await WalletTransaction.create({

      user: userId,
      type: "withdrawal",
      amount,
      status: "completed",
      description: "Worker wallet withdrawal"

    });

    res.json({
      message: "Withdrawal successful"
    });

  } catch (err) {

    res.status(500).json({
      message: "Withdrawal failed"
    });

  }

});

module.exports = router;