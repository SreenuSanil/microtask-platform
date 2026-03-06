const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    connection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Connection",
      required: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: ["text", "voice", "image", "budget"],
      default: "text",
    },

    message: String,
    imageUrl: String,
    voiceUrl: String,
    budgetAmount: Number,

    isRead: {
  type: Boolean,
  default: false,
},
  },
  { timestamps: true }
);

// TTL INDEX FOR AUTO DELETE AFTER 30 DAYS
messageSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 30 }
);
messageSchema.index({ connection: 1 });


module.exports = mongoose.model("Message", messageSchema);
