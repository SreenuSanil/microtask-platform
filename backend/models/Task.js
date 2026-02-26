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
        "in_progress",
        "completed",
        "cancelled",
      ],
      default: "open",
    },

assignedWorker: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  default: null,
},

completedAt: {
  type: Date,
},



  },
  { timestamps: true }
);

taskSchema.index({ location: "2dsphere" });



module.exports = mongoose.model("Task", taskSchema);
