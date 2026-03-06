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

    location: {
  type: {
    type: String,
    enum: ["Point"],
    default: "Point",
  },
  coordinates: {
    type: [Number], // [longitude, latitude]
    required: true,
  },
},

address: {
  type: String,
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


skills: [
  {
    type: String,
    lowercase: true,
    trim: true,
  }
],

isAvailable: {
  type: Boolean,
  default: false,
},

availableUntil: {
  type: Date,
  default: null,
},




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

/* Interview Evaluation Score */
skillRatings: [
  {
    skill: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      default: 0,
    },
    ratingAverage: {
      type: Number,
      default: 0,
    },
    ratingCount: {
      type: Number,
      default: 0,
    }
  }
],

cancelCount: {
  type: Number,
  default: 0
},

completedTasks: {
  type: Number,
  default: 0,
},
skillCompletedTasks: [
  {
    skill: {
      type: String,
      lowercase: true,
      trim: true,
    },
    count: {
      type: Number,
      default: 0,
    },
  },
],

complaintCount: {
  type: Number,
  default: 0,
},

overallRating: {
  type: Number,
  default: 0,
},

ratingCount: {
  type: Number,
  default: 0,
},

/* =========================
   WORKER PROFILE EXTRA DATA
========================= */

previousWorks: [
  {
    type: String, // image path
  }
],

bio: {
  type: String,
  default: "",
},

experienceYears: {
  type: Number,
  default: 0,
},

pastWorkDescription: {
  type: String,
  default: "",
},

certifications: {
  type: String,
  default: "",
},

languages: {
  type: String,
  default: "",
},

reviews: [
 {
   user: {
     type: String
   },

   rating: {
     type: Number
   },

   comment: {
     type: String
   },

   skill: {
     type: String
   },

   task: {
     type: mongoose.Schema.Types.ObjectId,
     ref: "Task"
   },

   createdAt: {
     type: Date,
     default: Date.now
   }
 }
],



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
userSchema.index({ location: "2dsphere" });


module.exports = mongoose.model("User", userSchema);
