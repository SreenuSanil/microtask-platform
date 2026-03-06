const mongoose = require("mongoose");

const walletTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    relatedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
    },

    type: {
      type: String,
      enum: [
  "escrow_payment",
  "task_payment_release",
  "commission",
  "refund",
  "worker_earning",
  "withdrawal",
],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "completed",
    },

    description: String,
  },
  { timestamps: true }
);

walletTransactionSchema.index({ user: 1 });
walletTransactionSchema.index({ type: 1 });

module.exports = mongoose.model(
  "WalletTransaction",
  walletTransactionSchema
);