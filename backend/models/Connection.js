const mongoose = require("mongoose");

const connectionSchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "provider_confirmed",
        "confirmed",
        "rejected",
        "closed",
      ],
      default: "pending",
    },

    chatEnabled: {
      type: Boolean,
      default: false,
    },

    finalBudget: Number,

    budgetConfirmed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Connection", connectionSchema);
