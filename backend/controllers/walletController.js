const WalletTransaction = require("../models/WalletTransaction");

exports.getWorkerWalletSummary = async (req, res) => {

  try {

    const userId = req.user.userId;

    const transactions = await WalletTransaction.find({
      user: userId
    });

    let totalEarnings = 0;
    let withdrawals = 0;

    transactions.forEach(txn => {

      if (txn.type === "worker_earning") {
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
      message: "Failed to load wallet"
    });

  }

};


exports.getWorkerTransactions = async (req, res) => {

  try {

    const userId = req.user.userId;

    const transactions = await WalletTransaction
      .find({ user: userId })
      .populate("task", "title")
      .sort({ createdAt: -1 });

    res.json(transactions);

  } catch (err) {

    res.status(500).json({
      message: "Failed to load transactions"
    });

  }

};


exports.withdrawMoney = async (req, res) => {

  try {

    const userId = req.user.userId;
    const { amount } = req.body;

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

      if (txn.type === "worker_earning") {
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

};