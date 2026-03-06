const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    requiredSkill: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: true,
      },
    },

    siteAddress: {
      houseName: String,
      area: String,
      landmark: String,
      instructions: String,
    },

    taskDate: {
      type: Date,
      required: true,
    },

    budget: {
      type: Number,
      required: true,
    },

    urgency: {
      type: String,
      enum: ["normal", "urgent"],
      default: "normal",
    },
    images: [
  {
    type: String,
  },
],


   status: {
  type: String,
  enum: [
    "open",
    "assigned",
    "accepted",
    "in_progress",
    "pending_verification",
    "completed",
    "cancelled",
    "dispute"
  ],
      default: "open",
    },

assignedWorker: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  default: null,
},
cancelledBy: {
  type: String,
  enum: ["worker", "provider","admin"]
},

completedAt: {
  type: Date,
},

completionImage: {
  type: String,
},

rejectionReason: {
  type: String,
  default: "",
},

rejectedAt: {
  type: Date,
},

dispute: {
  raisedBy: {
    type: String,
    enum: ["worker", "provider"],
  },

  reason: {
    type: String,
  },

  raisedAt: {
    type: Date,
  },

  status: {
    type: String,
    enum: ["open", "resolved"],
    default: "open",
  }
},

verifiedAt: {
  type: Date,
},

  paymentStatus: {
    type: String,
    enum: ["pending", "paid"],
    default: "pending"
  },

 escrowStatus: {
  type: String,
  enum: ["none", "held", "released", "refunded","split"],
  default: "none"
},

  razorpayOrderId: String,
  razorpayPaymentId: String

  },
  { timestamps: true }
);

taskSchema.index({ location: "2dsphere" });

taskSchema.index({ provider: 1 });
taskSchema.index({ status: 1 });

module.exports = mongoose.model("Task", taskSchema);
