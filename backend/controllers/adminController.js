const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");
const Notification = require("../models/Notification");
const Task = require("../models/Task");
const Connection = require("../models/Connection");
const Message = require("../models/Message");
const WalletTransaction = require("../models/WalletTransaction");
const { createNotification } = require("./notificationController");
const Settings = require("../models/Settings");
const { workerRejectedTemplate } = require("../utils/emailTemplates");
const { interviewScheduledTemplate } = require("../utils/emailTemplates");
const { workerBlockedTemplate } = require("../utils/emailTemplates");
const { workerUnblockedTemplate } = require("../utils/emailTemplates");
const { workerRemovedTemplate } = require("../utils/emailTemplates");
const { workerApprovedTemplate } = require("../utils/emailTemplates");
const {
  providerBlockedTemplate,
  providerUnblockedTemplate,
  providerRemovedTemplate,
} = require("../utils/emailTemplates");
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
 const { workerIds, interviewDate, interviewTime, interviewLocation } = req.body;

  try {
    // Get workers first
    const workers = await User.find({ _id: { $in: workerIds } });

    // Update interview details
    await User.updateMany(
      { _id: { $in: workerIds } },
      {
        $set: {
          "interview.interviewStatus": "scheduled",
          "interview.scheduledDate": interviewDate,
           "interview.location": interviewLocation,
        },
      }
    );

for (const worker of workers) {
  try {
    const { subject, html } = interviewScheduledTemplate(
      worker.name,
      interviewDate,
      interviewTime,
      interviewLocation 
    );

    await sendEmail({
      to: worker.email,
      subject,
      html,
    });
  } catch (err) {
    console.error("Email failed:", worker.email);
  }
}
    

    res.json({ message: "Interview scheduled & emails sent" });

  } catch (error) {
    console.error(error);
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
worker.skillRatings = ratings.map((r) => {
  const safeRating = Math.min(5, Math.max(1, Number(r.rating)));

  return {
    skill: r.skill,
    rating: safeRating,
    ratingAverage: safeRating,
    ratingCount: 1,
  };
});

    // ✅ Calculate overall rating
    worker.overallRating =
      ratings.reduce((sum, r) => sum + r.rating, 0) /
      ratings.length;

    // ✅ Approve worker
    worker.approvalStatus = "approved";

    await worker.save();

    // ✅ SEND APPROVAL EMAIL
const { subject, html } = workerApprovedTemplate(worker.name);

await sendEmail({
  to: worker.email,
  subject,
  html,
});

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
    const worker = await User.findById(workerId);

    if (!worker) {
      return res.status(404).json({ error: "Worker not found" });
    }

    worker.approvalStatus = "rejected";

    await worker.save();

    const { subject, html } = workerRejectedTemplate(
      worker.name,
      reason
    );

    await sendEmail({
      to: worker.email,
      subject,
      html,
    });

    res.json({ message: "Worker rejected & email sent" });

  } catch (err) {
    res.status(500).json({ error: "Rejection failed" });
  }
};

exports.blockWorker = async (req, res) => {
  const { workerId, reason, days } = req.body;

  try {
    const worker = await User.findById(workerId);

    if (!worker) {
      return res.status(404).json({ error: "Worker not found" });
    }

    let blockedUntil = null;

    if (days) {
      blockedUntil = new Date();
      blockedUntil.setDate(blockedUntil.getDate() + days);
    }

    // ✅ update using object
    worker.accountStatus = "blocked";
    worker.blockReason = reason;
    worker.blockedUntil = blockedUntil;

    await worker.save();

    await Notification.create({
      userId: workerId,
      title: "Account Blocked",
      message: `Your account has been blocked. Reason: ${reason}`,
    });

    // ✅ email
    const { subject, html } = workerBlockedTemplate(
      worker.name,
      reason,
      days
    );

    await sendEmail({
      to: worker.email,
      subject,
      html,
    });

    res.json({
      message: days
        ? `Blocked for ${days} days`
        : "Blocked permanently",
    });

  } catch (err) {
    res.status(500).json({ error: "Block failed" });
  }
};


exports.unblockWorker = async (req, res) => {
  const { workerId } = req.body;

  try {
    const worker = await User.findById(workerId);

    if (!worker) {
      return res.status(404).json({ error: "Worker not found" });
    }

    worker.accountStatus = "active";
    worker.blockReason = null;
    worker.blockedUntil = null;

    await worker.save();

    await Notification.create({
      userId: workerId,
      title: "Account Unblocked",
      message: "Your account has been unblocked.",
    });

    const { subject, html } = workerUnblockedTemplate(worker.name);

    await sendEmail({
      to: worker.email,
      subject,
      html,
    });

    res.json({ message: "Worker unblocked" });

  } catch (err) {
    res.status(500).json({ error: "Unblock failed" });
  }
};

exports.removeWorker = async (req, res) => {
  const { workerId, reason } = req.body;

  try {
    const worker = await User.findById(workerId);

    if (!worker) {
      return res.status(404).json({ error: "Worker not found" });
    }

    worker.accountStatus = "removed";
    worker.removeReason = reason;

    await worker.save();

    await Notification.create({
      userId: workerId,
      title: "Account Removed",
      message: `Reason: ${reason}`,
    });

    const { subject, html } = workerRemovedTemplate(
      worker.name,
      reason
    );

    await sendEmail({
      to: worker.email,
      subject,
      html,
    });

    res.json({ message: "Worker removed" });

  } catch (err) {
    res.status(500).json({ error: "Remove failed" });
  }
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

  try {
    const provider = await User.findById(providerId);

    if (!provider) {
      return res.status(404).json({ error: "Provider not found" });
    }

    let blockedUntil = null;

    if (days) {
      blockedUntil = new Date();
      blockedUntil.setDate(blockedUntil.getDate() + days);
    }

    provider.accountStatus = "blocked";
    provider.blockReason = reason;
    provider.blockedUntil = blockedUntil;

    await provider.save();

    const { subject, html } = providerBlockedTemplate(
      provider.name,
      reason,
      days
    );

    await sendEmail({
      to: provider.email,
      subject,
      html,
    });

    res.json({ message: "Provider blocked" });

  } catch (err) {
    res.status(500).json({ error: "Block failed" });
  }
};


// unblock provider
exports.unblockProvider = async (req, res) => {
  const { providerId } = req.body;

  try {
    const provider = await User.findById(providerId);

    if (!provider) {
      return res.status(404).json({ error: "Provider not found" });
    }

    provider.accountStatus = "active";
    provider.blockReason = null;
    provider.blockedUntil = null;

    await provider.save();

    const { subject, html } = providerUnblockedTemplate(provider.name);

    await sendEmail({
      to: provider.email,
      subject,
      html,
    });

    res.json({ message: "Provider unblocked" });

  } catch (err) {
    res.status(500).json({ error: "Unblock failed" });
  }
};

// remove provider
exports.removeProvider = async (req, res) => {
  const { providerId, reason } = req.body;

  try {
    const provider = await User.findById(providerId);

    if (!provider) {
      return res.status(404).json({ error: "Provider not found" });
    }

    provider.accountStatus = "removed";
    provider.removeReason = reason;

    await provider.save();

    const { subject, html } = providerRemovedTemplate(
      provider.name,
      reason
    );

    await sendEmail({
      to: provider.email,
      subject,
      html,
    });

    res.json({ message: "Provider removed" });

  } catch (err) {
    res.status(500).json({ error: "Remove failed" });
  }
};

/* =========================
   DISPUTE MANAGEMENT
========================= */

exports.getDisputes = async (req, res) => {
  try {

    const tasks = await Task.find({
      status: "dispute",
      "dispute.status": "open"
    })
      .populate("provider", "name phone profileImage")
      .populate("assignedWorker", "name phone profileImage")
      .sort({ createdAt: -1 });

    res.json(tasks);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch disputes" });
  }
};

exports.getDisputeChat = async (req, res) => {
  try {

    const { taskId } = req.params;

    const connection = await Connection.findOne({ task: taskId });

    if (!connection)
      return res.json([]);

    const messages = await Message.find({
      connection: connection._id
    })
      .populate("sender", "name role")
      .sort({ createdAt: 1 });

    res.json(messages);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch chat" });
  }
};

exports.approveWorkerDispute = async (req, res) => {
  try {

    const task = await Task.findById(req.params.taskId);

    if (!task)
      return res.status(404).json({ message: "Task not found" });

    task.status = "completed";
    task.escrowStatus = "released";

    task.dispute.status = "resolved";

    await task.save();

const settings = await Settings.findOne();
const commissionPercent = settings?.commissionPercent || 10;

const totalAmount = task.budget;

const commission = (totalAmount * commissionPercent) / 100;
const workerAmount = totalAmount - commission;

/* =========================
   WORKER PAYMENT
========================= */
await WalletTransaction.create({
  user: task.assignedWorker,
  relatedUser: task.provider,
  task: task._id,
  type: "worker_earning",
 amount: Number(workerAmount),
  description: `Dispute resolved: payment after ${commissionPercent}% commission`,
});

/* =========================
   PLATFORM COMMISSION
========================= */
await WalletTransaction.create({
  user: task.provider,
  relatedUser: task.assignedWorker,
  task: task._id,
  type: "commission",
  amount: commission,
  description: `Platform commission (${commissionPercent}%)`,
});

    // 🔔 NOTIFY BOTH
await Notification.create({
  userId: task.assignedWorker,
  title: "Dispute Resolved",
  message: "Admin approved your work. Payment released.",
  taskId: task._id,
});

await Notification.create({
  userId: task.provider,
  title: "Dispute Resolved",
  message: "Admin approved worker. Payment released to worker.",
  taskId: task._id,
});

const provider = await User.findById(task.provider);
const worker = await User.findById(task.assignedWorker);

// 📧 Worker email
try {
  const { subject, html } =
    disputeResolvedWorkerTemplate(worker.name, task.title);

  await sendEmail({
    to: worker.email,
    subject,
    html,
  });
} catch (err) {
  console.log("Email failed:", err.message);
}

// 📧 Provider email
try {
  await sendEmail({
    to: provider.email,
    subject: "Dispute Resolved",
    html: `
      <h2>Dispute Resolved</h2>
      <p>Hello ${provider.name},</p>
      <p>Admin approved worker for task:</p>
      <h3>${task.title}</h3>
      <p>Payment released to worker.</p>
    `,
  });
} catch (err) {
  console.log("Email failed:", err.message);
}

    res.json({ message: "Worker approved, payment released" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Approval failed" });
  }
};

exports.refundProviderDispute = async (req, res) => {
  try {

    const task = await Task.findById(req.params.taskId);

    if (!task)
      return res.status(404).json({ message: "Task not found" });

   task.status = "cancelled";
   task.cancelledBy = "admin";
const reason = req.body?.reason || "Admin refund after dispute";
task.cancelReason = reason;
    task.escrowStatus = "refunded";

    task.dispute.status = "resolved";

    await task.save();

// 🔔 NOTIFY BOTH

// Provider
await Notification.create({
  userId: task.provider,
  title: "Dispute Resolved",
  message: "Admin refunded your payment.",
  taskId: task._id,
});

// Worker
if (task.assignedWorker) {
  await Notification.create({
    userId: task.assignedWorker,
    title: "Dispute Resolved",
    message: "Admin rejected your work. Payment refunded to provider.",
    taskId: task._id,
  });
}
const provider = await User.findById(task.provider);
const worker = task.assignedWorker
  ? await User.findById(task.assignedWorker)
  : null;

// 📧 Provider email
try {
  const { subject, html } =
    disputeResolvedProviderTemplate(provider.name, task.title);

  await sendEmail({
    to: provider.email,
    subject,
    html,
  });
} catch (err) {
  console.log("Email failed:", err.message);
}

// 📧 Worker email
if (worker) {
  try {
    await sendEmail({
      to: worker.email,
      subject: "Dispute Result",
      html: `
        <h2>Dispute Result</h2>
        <p>Hello ${worker.name},</p>
        <p>Your work was not approved:</p>
        <h3>${task.title}</h3>
        <p>Payment refunded to provider.</p>
      `,
    });
  } catch (err) {
    console.log("Email failed:", err.message);
  }
}

    await WalletTransaction.create({
      user: task.provider,
      relatedUser: task.assignedWorker || null,
      task: task._id,
      type: "refund",
      amount: task.budget,
      description: "Admin refunded provider after dispute",
    });

    res.json({ message: "Provider refunded" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Refund failed" });
  }
};

exports.splitPaymentDispute = async (req, res) => {
  try {

    const { workerAmount, providerAmount } = req.body;

    const task = await Task.findById(req.params.taskId);
if (!task)
      return res.status(404).json({ message: "Task not found" });

const settings = await Settings.findOne();
const commissionPercent = settings?.commissionPercent || 10;

const totalAmount = task.budget;

// 💰 commission first
const commission = (totalAmount * commissionPercent) / 100;

// 💰 remaining after commission
const remainingAmount = totalAmount - commission;
   


if (Number(workerAmount) + Number(providerAmount) !== remainingAmount) {
  return res.status(400).json({
    message: `Split must equal ₹${remainingAmount} after ${commissionPercent}% commission`,
  });
}

    task.status = "completed";
    task.escrowStatus = "split";

    task.dispute.status = "resolved";

    task.splitDetails = {
  workerAmount: Number(workerAmount),
  providerAmount: Number(providerAmount),
  commission,
};

    await task.save();

    await WalletTransaction.create({
      user: task.assignedWorker,
      relatedUser: task.provider,
      task: task._id,
      type: "worker_earning",
      amount: Number(workerAmount),
      description: "Split dispute payment",
    });

    await WalletTransaction.create({
      user: task.provider,
      relatedUser: task.assignedWorker,
      task: task._id,
      type: "refund",
     amount: Number(providerAmount),
      description: "Split dispute refund",
    });

    await WalletTransaction.create({
  user: task.provider,
  relatedUser: task.assignedWorker,
  task: task._id,
  type: "commission",
  amount: commission,
  description: `Platform commission (${commissionPercent}%)`,
});

    // 🔔 NOTIFY BOTH WITH SPLIT DETAILS

await Notification.create({
  userId: task.assignedWorker,
  title: "Dispute Resolved (Split)",
  message: `After ${commissionPercent}% commission, you received ₹${workerAmount}`,
  taskId: task._id,
});

await Notification.create({
  userId: task.provider,
  title: "Dispute Resolved (Split)",
  message: `After ${commissionPercent}% commission, you received ₹${providerAmount}`,
  taskId: task._id,
});

    res.json({ message: "Payment split successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Split payment failed" });
  }
};

exports.getAllTasks = async (req, res) => {
  try {

    const tasks = await Task.find()
      .populate("provider", "name phone profileImage")
      .populate("assignedWorker", "name phone profileImage")
      .sort({ createdAt: -1 });

    res.json(tasks);

  } catch (err) {
    console.error("ADMIN TASK FETCH ERROR:", err);
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
};

exports.adminCancelTask = async (req, res) => {
  try {

    const task = await Task.findById(req.params.taskId);

    if (!task)
      return res.status(404).json({ message: "Task not found" });

    if (task.status === "completed")
      return res.status(400).json({
        message: "Completed tasks cannot be cancelled"
      });

task.status = "cancelled";
    
    task.cancelledBy = "admin";

    await task.save();

    // Notify Provider
await createNotification({
  userId: task.provider,
  title: "Task Cancelled",
  message: `Admin cancelled the task "${task.title}".`,
  taskId: task._id,
});

// Notify Worker
if (task.assignedWorker) {
  await createNotification({
    userId: task.assignedWorker,
    title: "Task Cancelled",
    message: `Admin cancelled the task "${task.title}".`,
    taskId: task._id,
  });
}
// ✅ Track provider cancellation % and alert admin + warn provider
const provider = await User.findById(task.provider);

if (provider) {
  provider.cancelCount = (provider.cancelCount || 0) + 1;
  await provider.save();

  const totalProviderTasks = await Task.countDocuments({
    provider: provider._id,
  });

  const providerCancelPercent = (provider.cancelCount / totalProviderTasks) * 100;

  // warn provider at 50%
  if (providerCancelPercent >= 50 && provider.cancelCount >= 3) {
    await Notification.create({
      userId: task.provider,
      title: "Cancellation Warning",
      message: `You have cancelled ${Math.round(providerCancelPercent)}% of your tasks. If this continues, admin may review your account and you could be blocked or removed.`,
    });
  }

  // alert admin at 70%
  if (providerCancelPercent >= 70 && provider.cancelCount >= 3) {
    await Notification.create({
      userId: req.user._id,
      title: "High Cancellation Alert",
      message: `Provider ${provider.name} has cancelled ${Math.round(providerCancelPercent)}% of their tasks (${provider.cancelCount} out of ${totalProviderTasks}).`,
      userRole: "provider",
    });
  }
}

// ✅ Track worker cancellation % and alert admin + warn worker
if (task.assignedWorker) {
  const worker = await User.findById(task.assignedWorker);

  if (worker) {
    worker.cancelCount = (worker.cancelCount || 0) + 1;
    await worker.save();

    const totalWorkerTasks = await Task.countDocuments({
      assignedWorker: worker._id,
    });

    const workerCancelPercent = (worker.cancelCount / totalWorkerTasks) * 100;

    // warn worker at 50%
    if (workerCancelPercent >= 50 && worker.cancelCount >= 3) {
      await Notification.create({
        userId: task.assignedWorker,
        title: "Cancellation Warning",
        message: `You have cancelled ${Math.round(workerCancelPercent)}% of your tasks. If this continues, admin may review your account and you could be blocked or removed.`,
      });
    }

    // alert admin at 70%
    if (workerCancelPercent >= 70 && worker.cancelCount >= 3) {
      await Notification.create({
        userId: req.user._id,
        title: "High Cancellation Alert",
        message: `Worker ${worker.name} has cancelled ${Math.round(workerCancelPercent)}% of their tasks (${worker.cancelCount} out of ${totalWorkerTasks}).`,
        userRole: "worker",
      });
    }
  }
}

    res.json({
      message: "Task cancelled by admin",
      task
    });

  } catch (err) {
    console.error("ADMIN CANCEL ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};
/* =========================
   ADMIN DASHBOARD OVERVIEW
========================= */

exports.getAdminDashboard = async (req, res) => {
  try {

    // Total users
    const totalWorkers = await User.countDocuments({ role: "worker" });
    const totalProviders = await User.countDocuments({ role: "provider" });

    // Tasks
    const totalTasks = await Task.countDocuments();

    const completedTasks = await Task.countDocuments({
      status: "completed",
    });

    const openTasks = await Task.countDocuments({
      status: "open",
    });

    const inProgressTasks = await Task.countDocuments({
      status: "in_progress",
    });

    const disputedTasks = await Task.countDocuments({
      status: "dispute",
    });

    // Pending interviews
    const pendingInterviews = await User.countDocuments({
      role: "worker",
      "interview.interviewStatus": "not_scheduled",
    });

    // Workers waiting approval
    const pendingWorkers = await User.countDocuments({
      role: "worker",
      approvalStatus: "pending",
      "interview.interviewStatus": "completed",
    });

    const activeDisputes = disputedTasks;

    // Revenue
// ✅ Revenue (CORRECT LOGIC)
const transactions = await WalletTransaction.find();

let commission = 0;
let registration = 0;
let withdrawals = 0;

transactions.forEach(txn => {
  if (txn.type === "commission") {
    commission += txn.amount;
  }

  if (txn.type === "registration_fee") {
    registration += txn.amount;
  }

  if (txn.type === "admin_withdrawal") {
    withdrawals += txn.amount;
  }
});

const totalRevenue = commission + registration - withdrawals;
    res.json({
      totalWorkers,
      totalProviders,
      totalTasks,
      totalRevenue,
      openTasks,
      inProgressTasks,
      completedTasks,
      disputedTasks,
      pendingInterviews,
      pendingWorkers,
      activeDisputes
    });

  } catch (err) {
    console.error("ADMIN DASHBOARD ERROR:", err);
    res.status(500).json({ message: "Dashboard fetch failed" });
  }
};
