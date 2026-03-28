const express = require("express");
const router = express.Router();
const WalletTransaction = require("../models/WalletTransaction");
const protect = require("../middleware/authMiddleware");

/* =========================
   REVENUE SUMMARY
========================= */

router.get("/summary", protect, async (req, res) => {

  try {

    const transactions = await WalletTransaction.find();

    let commissionRevenue = 0;
    let registrationRevenue = 0;
    let withdrawals = 0;

    transactions.forEach(txn => {

      if (txn.type === "commission") {
        commissionRevenue += txn.amount;
      }

      if (txn.type === "registration_fee") {
        registrationRevenue += txn.amount;
      }

if (txn.type === "admin_withdrawal") {
  withdrawals += txn.amount;
}

    });

    const totalRevenue = commissionRevenue + registrationRevenue;
    const walletBalance = totalRevenue - withdrawals;

    res.json({
      totalRevenue,
      commissionRevenue,
      registrationRevenue,
      withdrawals,
      walletBalance
    });

  } catch (err) {

    console.error(err);
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
        $match: {
          type: { $in: ["commission", "registration_fee"] } // ✅ FIX
        }
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
     type: { $in: ["commission", "registration_fee", "admin_withdrawal"] }
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
router.post("/withdraw", protect, async (req, res) => {

  try {

    const { amount } = req.body;

    const transactions = await WalletTransaction.find();

    let commission = 0;
    let registration = 0;
    let withdrawals = 0;

    transactions.forEach(txn => {

      if (txn.type === "commission") commission += txn.amount;
      if (txn.type === "registration_fee") registration += txn.amount;

if (txn.type === "admin_withdrawal") {
  withdrawals += txn.amount;
}

    });

    const balance = commission + registration - withdrawals;

    if (amount > balance) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

await WalletTransaction.create({
  user: req.user.userId, 
  type: "admin_withdrawal",
  amount,
  description: "Admin withdrawal"
});

    res.json({ message: "Withdraw successful" });

  } catch (err) {

    res.status(500).json({ message: "Withdraw failed" });

  }

});

module.exports = router;