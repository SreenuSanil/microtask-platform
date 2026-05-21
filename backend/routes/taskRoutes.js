const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const Task = require("../models/Task");
const multer = require("multer");
const User = require("../models/User");
const Message = require("../models/Message");
const Settings = require("../models/Settings");
const WalletTransaction = require("../models/WalletTransaction");
const Notification = require("../models/Notification");
const sendEmail = require("../utils/sendEmail");
const Connection = require("../models/Connection");
const {
  workerCancelledTaskTemplate,
  providerCancelledTaskTemplate,
  adminCancelledTaskTemplate,
  disputeResolvedWorkerTemplate,
  disputeResolvedProviderTemplate
} = require("../utils/emailTemplates");
const storage = multer.diskStorage({
  destination: "uploads/tasks",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

const storageCompletion = multer.diskStorage({
  destination: "uploads/completions",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const uploadCompletion = multer({ storage: storageCompletion });

// Create Task
router.post("/", auth, upload.array("images", 3), async (req, res) => {

  try {
    const {
      title,
      description,
      requiredSkill,

      city,
      pincode,
      taskDate,
      budget,
      urgency,
      latitude,
      longitude,
      houseName,
      area,
      landmark,
      instructions,

    } = req.body;

   
if (new Date(taskDate) < new Date().setHours(0,0,0,0)) {
  return res.status(400).json({ message: "Past date not allowed" });
}

    const imagePaths = req.files
  ? req.files.map((file) => file.path)
  : [];


const newTask = new Task({
  provider: req.user.userId,
  title,
  requiredSkill,
  description,
  taskDate,
  budget,
  urgency,
  images: imagePaths,

  location: {
    type: "Point",
    coordinates: [Number(longitude), Number(latitude)],
  },

  siteAddress: {
    houseName,
    area,
    landmark,
    instructions,
  },
});


    await newTask.save();

    res.status(201).json({ message: "Task posted successfully" });
  } catch (error) {
    console.error("TASK ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET My Tasks (Provider)
router.get("/my-tasks", auth, async (req, res) => {
  try {

    const tasks = await Task.find({
  provider: req.user.userId,
})
.populate("provider", "name profileImage")
.populate("assignedWorker", "name profileImage")
.sort({ createdAt: -1 });


    res.json(tasks);
    
  } catch (error) {
    console.error("FETCH TASK ERROR:", error);
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
});

router.get("/worker-dashboard", auth, async (req, res) => {
  try {
    const workerId = req.user.userId;

    const tasks = await Task.find({
      assignedWorker: workerId
    });

    const transactions = await WalletTransaction.find({
      user: workerId,
      status: "completed"
    });

    /* =========================
       💰 MATCH WALLET PAGE EXACTLY
    ========================= */

    let walletBalance = 0;
    let totalEarnings = 0;

    transactions.forEach(t => {

      // 💰 Earnings (same as wallet page)
      if (
        t.type === "worker_earning" ||
        t.type === "task_payment_release" ||
        t.type === "compensation"
      ) {
        totalEarnings += t.amount;
        walletBalance += t.amount;
      }

      // 💸 Withdrawals
      if (t.type === "worker_withdrawal") {
        walletBalance -= t.amount;
      }

      // (optional safety)
      if (t.type === "refund") {
        walletBalance += t.amount;
      }

    });

    /* =========================
       📊 TASK STATS
    ========================= */

    const stats = {
      waitingPayment: tasks.filter(t => t.status === "assigned").length,
      ongoing: tasks.filter(t => t.status === "in_progress").length,
      pendingApproval: tasks.filter(t => t.status === "pending_verification").length,
      completed: tasks.filter(t => t.status === "completed").length,
      disputes: tasks.filter(t => t.status === "dispute").length
    };

    const user = await User.findById(workerId);

    const rating =
      user.skillRatings.length > 0
        ? user.skillRatings.reduce((sum, s) => sum + s.ratingAverage, 0) /
          user.skillRatings.length
        : 0;

    res.json({
      walletBalance,
      totalEarnings,
      rating,
      ...stats
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task)
      return res.status(404).json({ message: "Task not found" });

    if (task.provider.toString() !== req.user.userId.toString())
      return res.status(403).json({ message: "Not authorized" });

    await task.deleteOne();

    res.json({ message: "Task deleted permanently" });

  } catch (error) {
    console.error("DELETE ERROR:", error);
    res.status(500).json({ message: "Delete failed" });
  }
});

// GET Worker Tasks
router.get("/worker-tasks", auth, async (req, res) => {
  try {
   

    const tasks = await Task.find({
      assignedWorker: req.user.userId,
    })
      .populate("provider", "name profileImage")
      .sort({ createdAt: -1 });

    res.json(tasks);

  } catch (err) {
    console.error("❌ Worker Tasks Error:", err);
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
});

router.get("/:id", auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) return res.status(404).json({ message: "Task not found" });

    res.json(task);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});


// UPDATE TASK
router.put("/:id", auth, upload.array("images", 3), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task)
      return res.status(404).json({ message: "Task not found" });

    if (task.provider.toString() !== req.user.userId.toString())
      return res.status(403).json({ message: "Not authorized" });

    const {
      title,
      description,
      requiredSkill,
      taskDate,
      budget,
      urgency,
      latitude,
      longitude,
      houseName,
      area,
      landmark,
      instructions,
    } = req.body;

  
if (new Date(taskDate) < new Date().setHours(0,0,0,0)) {
  return res.status(400).json({ message: "Past date not allowed" });
}

    // Update fields
    task.title = title;
    task.description = description;
    task.requiredSkill = requiredSkill;
    task.taskDate = taskDate;
    task.budget = budget;
    task.urgency = urgency;

task.siteAddress = {
  houseName,
  area,
  landmark,
  instructions,
};


    if (latitude && longitude) {
      task.location = {
        type: "Point",
        coordinates: [Number(longitude), Number(latitude)],
      };
    }

    // If new images uploaded
    if (req.files && req.files.length > 0) {
      task.images = req.files.map(file => file.path);
    }

    await task.save();

    res.json({ message: "Task updated successfully" });

  } catch (error) {
    console.error("UPDATE ERROR:", error);
    res.status(500).json({ message: "Update failed" });
  }
});

router.patch("/cancel-ongoing/:taskId", auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);

    if (!task)
      return res.status(404).json({ message: "Task not found" });

    if (task.status !== "in_progress")
      return res.status(400).json({
        message: "Only ongoing tasks can be cancelled"
      });

    const userId = req.user.userId;

/* =========================
🚨 TRACK CANCEL COUNT
========================= */

const user = await User.findById(userId);

// update cancel count
user.cancelCount = (user.cancelCount || 0) + 1;
await user.save();

// ✅ NEW LOGIC
const totalTasks = user.completedTasks + user.cancelCount;

const cancelRate =
  totalTasks > 0
    ? (user.cancelCount / totalTasks) * 100
    : 0;

// 🚨 notify admin 
if (cancelRate > 15 && totalTasks >= 5 && user.cancelCount % 2 === 0) {

  const adminUser = await User.findOne({ role: "admin" });

  if (adminUser) {
    await Notification.create({
      userId: adminUser._id,
      title: "⚠ High Cancellation Rate",
      message: `${user.name} has high cancellation rate (${cancelRate.toFixed(1)}%)`,
        userRole: user.role,       
       relatedUser: user._id 
    });
  }
}

    const isWorker =
      task.assignedWorker && task.assignedWorker.equals(userId);

    const isProvider =
      task.provider && task.provider.equals(userId);

const provider = await User.findById(task.provider);
const worker = task.assignedWorker
  ? await User.findById(task.assignedWorker)
  : null;

    if (!isWorker && !isProvider) {
      return res.status(403).json({ message: "Not allowed" });
    }

    /* =========================
       🔥 SET CANCEL INFO
    ========================= */
    task.status = "cancelled";
    task.cancelledBy = isWorker ? "worker" : "provider";

/* =========================
   💰 REFUND LOGIC
========================= */


if (task.paymentStatus === "paid") {
  let refundAmount = task.budget;

  // 🔥 WORKER CANCEL → FULL REFUND
  if (isWorker) {
    refundAmount = task.budget;

    await WalletTransaction.create({
      user: task.provider,
      relatedUser: task.assignedWorker,
      task: task._id,
      type: "refund",
      amount: refundAmount,
      description: "Full refund - worker cancelled the task",
    });
  }

if (isProvider) {


const totalCompensation = task.budget * 0.05;

const systemCut = totalCompensation * 0.4;
const workerAmount = totalCompensation - systemCut;

const refundAmount = task.budget - totalCompensation;

// 💰 REFUND TO PROVIDER
await WalletTransaction.create({
  user: task.provider,
  relatedUser: task.assignedWorker,
  task: task._id,
  type: "refund",
  amount: refundAmount,
  description: "Refund after cancellation (5% penalty applied)",
});

// 💰 WORKER COMPENSATION
if (task.assignedWorker) {
  await WalletTransaction.create({
    user: task.assignedWorker,
    relatedUser: task.provider,
    task: task._id,
    type: "compensation",
    amount: workerAmount,
    description: "Small compensation for cancellation",
  });
 

await User.findByIdAndUpdate(
  task.assignedWorker,
  {
    $inc: { walletBalance: workerAmount },
  }
);
}

// 💰 SYSTEM FEE
await WalletTransaction.create({
  user: task.provider,
  task: task._id,
  type: "commission",
  amount: systemCut,
  description: "Platform fee from cancellation",
});
await User.findByIdAndUpdate(
  task.provider,
  {
    $inc: { walletBalance: refundAmount },
  }
);
}

  task.escrowStatus = "refunded";
}



// 🔥 WORKER CANCEL → notify provider
if (isWorker) {
  await Notification.create({
    userId: task.provider,
    title: "Task Cancelled",
    message: "Worker cancelled the task. Full refund issued.",
    taskId: task._id,
  });
}
if (isWorker && provider) {
  try {
    const { subject, html } =
      workerCancelledTaskTemplate(provider.name, task.title);

    await sendEmail({
      to: provider.email,
      subject,
      html,
    });
  } catch (err) {
    console.log("Email failed:", err.message);
  }
}

// 🔥 PROVIDER CANCEL → notify worker
if (isProvider) {
  await Notification.create({
    userId: task.assignedWorker,
    title: "Task Cancelled",
    message: "Provider cancelled the task. Compensation has been credited.",
    taskId: task._id,
  });
}

if (isProvider && worker) {
  try {
    const { subject, html } =
      providerCancelledTaskTemplate(worker.name, task.title);

    await sendEmail({
      to: worker.email,
      subject,
      html,
    });
  } catch (err) {
    console.log("Email failed:", err.message);
  }
}

    await task.save();

    // optional: delete chat
  const connections = await Connection.find({ task: task._id });

for (let conn of connections) {
  await Message.deleteMany({ connection: conn._id });
}

    res.json({ message: "Task cancelled successfully" });

  } catch (err) {
    console.error("CANCEL TASK ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.patch("/reset/:taskId", auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);

    if (!task) return res.status(404).json({ message: "Task not found" });

   if (task.provider.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ message: "Not allowed" });
    }

    // 🔥 RESET TASK
    task.status = "open";
    task.assignedWorker = null;
    task.paymentStatus = "pending";

    await task.save();

    // 🔥 CLOSE ALL CONNECTIONS
// 🔥 DELETE CONNECTIONS COMPLETELY
await Connection.deleteMany({ task: task._id });
// 🔥 DELETE CHAT MESSAGES
const connections = await Connection.find({ task: task._id });

for (let conn of connections) {
  await Message.deleteMany({ connection: conn._id });
}
    res.json({ message: "Task reset to open" });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.patch("/admin-cancel/:taskId", auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);

    if (!task)
      return res.status(404).json({ message: "Task not found" });

    // 🔒 Only admin (you can improve role check later)
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin only" });
    }

    task.status = "cancelled";
    task.cancelledBy = "admin";

    const provider = await User.findById(task.provider);
const worker = task.assignedWorker
  ? await User.findById(task.assignedWorker)
  : null;

    /* 💰 FULL REFUND */
    if (task.paymentStatus === "paid") {
    

      await WalletTransaction.create({
        user: task.provider,
        task: task._id,
        type: "refund",
        amount: task.budget,
        description: "Full refund - cancelled by admin",
      });

      task.escrowStatus = "refunded";
    }

    /* 🔔 NOTIFICATIONS */

    if (task.provider) {
      await Notification.create({
        userId: task.provider,
        title: "Task Cancelled by Admin",
        message: "Admin cancelled the task. Refund issued.",
        taskId: task._id,
      });
    }

    if (task.assignedWorker) {
      await Notification.create({
        userId: task.assignedWorker,
        title: "Task Cancelled by Admin",
        message: "Admin cancelled this task.",
        taskId: task._id,
      });
    }

// 📧 EMAIL TO PROVIDER
if (provider) {
  try {
    const { subject, html } =
      adminCancelledTaskTemplate(provider.name, task.title);

    await sendEmail({
      to: provider.email,
      subject,
      html,
    });
  } catch (err) {
    console.log("Email failed:", err.message);
  }
}

// 📧 EMAIL TO WORKER
if (worker) {
  try {
    const { subject, html } =
      adminCancelledTaskTemplate(worker.name, task.title);

    await sendEmail({
      to: worker.email,
      subject,
      html,
    });
  } catch (err) {
    console.log("Email failed:", err.message);
  }
}

    await task.save();

    res.json({ message: "Admin cancelled task" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.patch("/reject/:taskId", auth, async (req, res) => {
  try {

    const { reason } = req.body;

    const task = await Task.findById(req.params.taskId);

    if (!task)
      return res.status(404).json({ message: "Task not found" });

    // Only provider can reject
    if (task.provider.toString() !== req.user.userId.toString())
      return res.status(403).json({ message: "Not authorized" });

    if (task.status !== "pending_verification")
      return res.status(400).json({
        message: "Task is not awaiting verification",
      });

    // Send task back to worker
    task.status = "in_progress";

    task.rejectionReason = reason || "Work not satisfactory";

    task.rejectedAt = new Date();

    // remove old completion image
    task.completionImage = null;

    await task.save();

    // 🔔 NOTIFY WORKER
await Notification.create({
  userId: task.assignedWorker,
  title: "Work Rejected",
  message: `Your work was rejected. Reason: ${reason}`,
  taskId: task._id,
});

    res.json({
      message: "Work rejected. Sent back to worker.",
      task,
    });

  } catch (err) {
    console.error("REJECT WORK ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.patch("/raise-dispute/:taskId", auth, async (req, res) => {
  try {

    const { reason } = req.body;

    const task = await Task.findById(req.params.taskId);

    if (!task)
      return res.status(404).json({ message: "Task not found" });

    const userId = req.user.userId;

    const isWorker =
      task.assignedWorker &&
      task.assignedWorker.toString() === userId.toString();

    const isProvider =
      task.provider &&
      task.provider.toString() === userId.toString();

    if (!isWorker && !isProvider)
      return res.status(403).json({ message: "Not authorized" });

    task.status = "dispute";

    task.dispute = {
      raisedBy: isWorker ? "worker" : "provider",
      reason: reason || "Dispute raised",
      raisedAt: new Date(),
      status: "open"
    };

    await task.save();

    // 🔔 NOTIFY ADMIN
const adminUser = await User.findOne({ role: "admin" });

if (adminUser) {
  await Notification.create({
    userId: adminUser._id,
    title: "⚠ New Dispute Raised",
    message: `Dispute raised on task "${task.title}" by ${isWorker ? "Worker" : "Provider"}`,
    taskId: task._id,
  });
}

    // 🔔 NOTIFY OTHER USER
const notifyUser = isWorker ? task.provider : task.assignedWorker;

await Notification.create({
  userId: notifyUser,
  title: "Dispute Raised",
  message: `A dispute has been raised: ${reason}`,
  taskId: task._id,
});

    res.json({
      message: "Dispute raised successfully",
      task
    });

  } catch (err) {
    console.error("DISPUTE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.patch(
  "/mark-complete/:taskId",
  auth,
  uploadCompletion.single("completionImage"),
  async (req, res) => {
    try {
      const task = await Task.findById(req.params.taskId);

      if (!task)
        return res.status(404).json({ message: "Task not found" });

      if (!task.assignedWorker)
        return res.status(400).json({ message: "No worker assigned" });

      if (task.assignedWorker.toString() !== req.user.userId.toString())
        return res.status(403).json({ message: "Not authorized" });

      if (task.status !== "in_progress")
        return res.status(400).json({ message: "Task not in progress" });

      task.status = "pending_verification";
      task.completedAt = new Date();

      if (req.file) {
        task.completionImage = req.file.path;
      }

      await task.save();
      // 🔔 NOTIFY PROVIDER
await Notification.create({
  userId: task.provider,
  title: "Work Submitted",
  message: "Worker has marked the task as completed. Please verify.",
  taskId: task._id,
});

      res.json({
        message: "Task submitted for provider verification",
      });

    } catch (err) {
      console.error("MARK COMPLETE ERROR:", err);
      res.status(500).json({ message: err.message });
    }
  }
);

router.patch("/:taskId/accept", auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);

    if (!task) 
      return res.status(404).json({ message: "Task not found" });

    if (!task.assignedWorker)
      return res.status(400).json({ message: "No worker assigned" });

    if (task.assignedWorker.toString() !== req.user.userId.toString())
      return res.status(403).json({ message: "Not authorized" });

    task.status = "accepted";
    await task.save();

    res.json({ message: "Task accepted", task });

  } catch (err) {
    res.status(500).json({ message: "Error accepting task" });
  }
});


router.patch("/approve/:taskId", auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);

    if (!task)
      return res.status(404).json({ message: "Task not found" });

    // Only provider can approve
    if (task.provider.toString() !== req.user.userId.toString())
      return res.status(403).json({ message: "Not authorized" });

    if (task.status !== "pending_verification")
      return res.status(400).json({ message: "Task not awaiting verification" });

    if (task.escrowStatus !== "held")
      return res.status(400).json({ message: "Escrow not locked" });

    // Release payment
    task.status = "completed";
    task.escrowStatus = "released";
    task.verifiedAt = new Date();




const Connection = require("../models/Connection");

// 🔥 GET SETTINGS
const settings = await Settings.findOne();

const commissionPercent = settings?.commissionPercent || 10;

// 🔥 GET FINAL AMOUNT
const connection = await Connection.findOne({
  task: task._id,
  status: "confirmed"
});

const totalAmount = Number(
  connection?.finalBudget || task.budget
);

if (!totalAmount || totalAmount <= 0) {
  return res.status(400).json({
    message: "Invalid payment amount"
  });
}

// 💰 CALCULATE
const commission = (totalAmount * commissionPercent) / 100;
const workerAmount = totalAmount - commission;

/* =========================
   WORKER EARNING
========================= */

await WalletTransaction.create({
  user: task.assignedWorker,
  relatedUser: task.provider,
  task: task._id,
  type: "worker_earning",
  amount: workerAmount,
  description: `Payment after ${commissionPercent}% commission`,
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

  const worker = await User.findById(task.assignedWorker);

// increase total completed jobs
worker.completedTasks += 1;

// increase skill-specific jobs
const skill = task.requiredSkill.toLowerCase();

let skillJob = worker.skillCompletedTasks.find(
  s => s.skill === skill
);

if (!skillJob) {
  worker.skillCompletedTasks.push({
    skill: skill,
    count: 1
  });
} else {
  skillJob.count += 1;
}

await worker.save();
await task.save();

// 🔔 NOTIFY WORKER
await Notification.create({
  userId: task.assignedWorker,
  title: "Task Approved",
  message: "Your work has been approved. Payment released 🎉",
  taskId: task._id,
});

    res.json({ message: "Task approved and payment released" });

  } catch (err) {
    console.error("APPROVE TASK ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/rate-worker/:taskId", auth, async (req, res) => {
  try {

    const { rating, comment } = req.body;

    const task = await Task.findById(req.params.taskId);

    if (!task)
      return res.status(404).json({ message: "Task not found" });

    // Only provider can rate
    if (task.provider.toString() !== req.user.userId.toString())
      return res.status(403).json({ message: "Not authorized" });

    if (task.status !== "completed")
      return res.status(400).json({ message: "Task not completed yet" });

    const worker = await User.findById(task.assignedWorker);

    const skill = task.requiredSkill.toLowerCase();

    let skillRating = worker.skillRatings.find(
      s => s.skill === skill
    );

    // If worker has no rating for this skill yet
    if (!skillRating) {
      skillRating = {
        skill: skill,
        rating: rating,
        ratingAverage: rating,
        ratingCount: 1
      };

      worker.skillRatings.push(skillRating);

    } else {

      skillRating.rating += rating;
      skillRating.ratingCount += 1;

      skillRating.ratingAverage =
        skillRating.rating / skillRating.ratingCount;
    }

    // Save review
    worker.reviews.push({
      user: req.user.name,
      rating,
      comment
    });

    await worker.save();

    res.json({ message: "Rating submitted successfully" });

  } catch (err) {
    console.error("RATING ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});



module.exports = router;
