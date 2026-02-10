const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: true,
      match: /^[6-9]\d{9}$/,
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    pincode: {
      type: String,
      required: true,
      match: /^\d{6}$/,
    },

    profileImage: {
  type: String, 
},


    role: {
      type: String,
      enum: ["admin", "provider", "worker"],
      required: true,
    },

    /* WORKER FIELDS */
    skills: String,
    availability: String,

    /* PROVIDER FIELDS */
    organization: String,
    taskType: String,

    /* APPROVAL SYSTEM */
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: function () {
        return this.role === "worker" ? "pending" : "approved";
      },
    },

    interview: {
      scheduledDate: Date,
      interviewStatus: {
        type: String,
        enum: ["not_scheduled", "scheduled", "completed"],
        default: "not_scheduled",
      },
    },

    rating: {
      type: Number,
      default: 0,
    },

    accountStatus: {
      type: String,
      enum: ["active", "blocked", "removed"],
      default: "active",
    },

    blockReason: {
      type: String,
    },


    removeReason: {
      type: String,
    },

    blockedUntil: {
  type: Date,
  default: null // null = permanently blocked
},

emailVerified: {
  type: Boolean,
  default: false,
},

emailVerifiedAt: {
  type: Date,
},

payment: {
  orderId: String,
  paymentId: String,
  signature: String,
  status: {
    type: String,
    enum: ["pending", "paid"],
    default: "pending",
  },
  paidAt: Date,  
},


  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
