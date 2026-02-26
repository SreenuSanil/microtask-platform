const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");
const Notification = require("../models/Notification");

/* =========================
   INTERVIEW MANAGEMENT
========================= */

// get workers for interview management
exports.getInterviewCandidates = async (req, res) => {
  try {
    const workers = await User.find({
      role: "worker",
       emailVerified: true,
      "payment.status": "paid",
      approvalStatus: "pending",
      "interview.interviewStatus": { $in: ["not_scheduled", "scheduled"] },
    }).select("-password");

    res.json(workers);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
};

// schedule interview
exports.scheduleInterview = async (req, res) => {
  const { workerIds, interviewDate } = req.body;

  try {
    await User.updateMany(
      { _id: { $in: workerIds } },
      {
        $set: {
          "interview.interviewStatus": "scheduled",
          "interview.scheduledDate": interviewDate,
        },
      }
    );

    // email simulated
    res.json({ message: "Interview scheduled successfully" });
  } catch {
    res.status(500).json({ error: "Interview scheduling failed" });
  }
};

// mark interview completed
exports.completeInterview = async (req, res) => {
  const { workerIds } = req.body;

  try {
    await User.updateMany(
      {
        _id: { $in: workerIds },
        "interview.interviewStatus": "scheduled",
      },
      {
        $set: { "interview.interviewStatus": "completed" },
      }
    );

    res.json({ message: "Interview marked as completed" });
  } catch {
    res.status(500).json({ error: "Failed to complete interview" });
  }
};

/* =========================
   WORKER MANAGEMENT
========================= */

// interview completed, waiting for approval
exports.getWorkersForApproval = async (req, res) => {
  try {
    const workers = await User.find({
      role: "worker",
      approvalStatus: "pending",
       emailVerified: true,
      "payment.status": "paid",     
      
      "interview.interviewStatus": "completed",
    }).select("-password");

    res.json(workers);
  } catch {
    res.status(500).json({ error: "Failed to fetch pending workers" });
  }
};

// fetch workers by status (approved)
exports.getWorkersByStatus = async (req, res) => {
  const { status } = req.query;

  try {
    const query = {
      role: "worker",
      emailVerified: true,
      "payment.status": "paid",
    };

    // ACTIVE workers
    if (status === "approved") {
      query.approvalStatus = "approved";
      query.accountStatus = "active";
    }

    // BLOCKED workers
    if (status === "blocked") {
      query.accountStatus = "blocked";
    }

    // REMOVED workers
    if (status === "removed") {
      query.accountStatus = "removed";
    }

    const workers = await User.find(query).select("-password");
    res.json(workers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch workers" });
  }
};



// approve worker
exports.approveWorker = async (req, res) => {
  const { workerId, ratings } = req.body;

  try {
    const worker = await User.findOne({
      _id: workerId,
      "interview.interviewStatus": "completed",
    });

    if (!worker) {
      return res.status(400).json({
        error: "Interview not completed",
      });
    }

    if (!ratings || !Array.isArray(ratings) || ratings.length === 0) {
      return res.status(400).json({
        error: "Ratings are required",
      });
    }

    // ✅ Save skill ratings
    worker.skillRatings = ratings.map((r) => ({
      skill: r.skill,
      rating: r.rating,
      ratingAverage: r.rating,
      ratingCount: 1,
    }));

    // ✅ Calculate overall rating
    worker.overallRating =
      ratings.reduce((sum, r) => sum + r.rating, 0) /
      ratings.length;

    // ✅ Approve worker
    worker.approvalStatus = "approved";

    await worker.save();

    res.json(worker);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Approval failed" });
  }
};


// reject worker
exports.rejectWorker = async (req, res) => {
  const { workerId, reason } = req.body;

  try {
    await User.findByIdAndUpdate(workerId, {
      approvalStatus: "rejected",
    });

    res.json({ message: "Worker rejected" });
  } catch {
    res.status(500).json({ error: "Rejection failed" });
  }
};

exports.blockWorker = async (req, res) => {
  const { workerId, reason, days } = req.body;

  let blockedUntil = null;

  if (days) {
    blockedUntil = new Date();
    blockedUntil.setDate(blockedUntil.getDate() + days);
  }

  await User.findByIdAndUpdate(workerId, {
    accountStatus: "blocked",
    blockReason: reason,
    blockedUntil,
  });

  await Notification.create({
    userId: workerId,
    title: "Account Blocked",
    message: `Your account has been blocked. Reason: ${reason}`,
  });

   res.json({
    message: days
      ? `Blocked for ${days} days`
      : "Blocked permanently",
  });
};


exports.unblockWorker = async (req, res) => {
  const { workerId } = req.body;

  await User.findByIdAndUpdate(workerId, {
    accountStatus: "active",
    blockReason: null,
  });

  await Notification.create({
    userId: workerId,
    title: "Account Unblocked",
    message: "Your account has been unblocked. You can continue working.",
  });

  res.json({ message: "Worker unblocked" });
};


exports.removeWorker = async (req, res) => {
  const { workerId, reason } = req.body;

  await User.findByIdAndUpdate(workerId, {
    accountStatus: "removed",
    removeReason: reason,
  });

  await Notification.create({
    userId: workerId,
    title: "Account Removed",
    message: `Your account has been removed. Reason: ${reason}`,
  });

  res.json({ message: "Worker removed" });
};



/* =========================
   PROVIDER MANAGEMENT
========================= */

// get approved providers
exports.getApprovedProviders = async (req, res) => {
  try {
    const providers = await User.find({
      role: "provider",
      approvalStatus: "approved",
        approvalStatus: "approved",
      emailVerified: true,
    }).select("-password");

    res.json(providers);
  } catch {
    res.status(500).json({ error: "Failed to fetch providers" });
  }
};

// block provider
exports.blockProvider = async (req, res) => {
  const { providerId, reason, days } = req.body;

  let blockedUntil = null;

  if (days) {
    blockedUntil = new Date();
    blockedUntil.setDate(blockedUntil.getDate() + days);
  }

  await User.findByIdAndUpdate(providerId, {
    accountStatus: "blocked",
    blockReason: reason,
    blockedUntil, // null = permanent
  });

  res.json({
    message: "Provider blocked",
    blockedUntil,
  });
};


// unblock provider
exports.unblockProvider = async (req, res) => {
  const { providerId } = req.body;

  await User.findByIdAndUpdate(providerId, {
    accountStatus: "active",
    blockReason: null,
    blockedUntil: null,
  });

  res.json({ message: "Provider unblocked" });
};

// remove provider
exports.removeProvider = async (req, res) => {
  const { providerId, reason } = req.body;

  await User.findByIdAndUpdate(providerId, {
    accountStatus: "removed",
    removeReason: reason,
  });

  res.json({ message: "Provider removed" });
};





