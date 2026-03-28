const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const auth = require("../middleware/authMiddleware");
const Task = require("../models/Task");
const Connection = require("../models/Connection");
const Settings = require("../models/Settings");
const WalletTransaction = require("../models/WalletTransaction");
const User = require("../models/User");
const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


// ================= CREATE ORDER (REGISTRATION) =================
router.post("/create-order", async (req, res) => {
  try {
    const options = {
      amount: 9900,
      currency: "INR",
      receipt: "worker_registration_" + Date.now(),
    };

    const order = await razorpay.orders.create(options);
    res.json(order);

  } catch (err) {
    console.error("CREATE ORDER ERROR:", err);
    res.status(500).json({ error: "Order creation failed" });
  }
});


// ================= VERIFY PAYMENT (REGISTRATION) =================
router.post("/verify-payment", auth, async (req, res) => {
  try {
    console.log("BODY RECEIVED:", req.body);

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: "Invalid payment signature",
      });
    }

    const existingUser = await User.findById(req.user.userId);

if (existingUser.payment?.status === "paid") {
  console.log("User already paid, skipping payment update");
}

const userId = req.user.userId;

// ✅ ONLY UPDATE IF NOT PAID
if (existingUser.payment?.status !== "paid") {
  await User.findByIdAndUpdate(userId, {
    payment: {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      status: "paid",
      paidAt: new Date(),
    },
  });
}
// ✅ CHECK EXISTING
const alreadyExists = await WalletTransaction.exists({
  user: userId,
  type: "registration_fee",
});

if (!alreadyExists) {
  await WalletTransaction.create({
    user: userId,
    type: "registration_fee",
    amount: 99,
    description: "Worker registration fee",
  });

  // ✅ ADMIN WALLET UPDATE (ONLY ONCE)
  const admin = await User.findOne({ role: "admin" });

  if (admin) {
    await User.findByIdAndUpdate(admin._id, {
      $inc: { walletBalance: 99 },
    });
  }
}


    return res.json({
      success: true,
      payment: {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
      },
    });

  } catch (err) {
    console.error("VERIFY PAYMENT ERROR:", err);
    res.status(500).json({ error: "Payment verification failed" });
  }
});


// ================= TASK CREATE ORDER =================
router.post("/task/create-order/:taskId", auth, async (req, res) => {
  try {

    const task = await Task.findById(req.params.taskId);

    if (!task)
      return res.status(404).json({ message: "Task not found" });

    if (task.paymentStatus === "paid") {
      return res.status(400).json({
        message: "Payment already verified",
      });
    }

    const connections = await Connection.find({
      task: task._id,
      status: "confirmed",
    });

    if (connections.length !== 1) {
      return res.status(400).json({
        message: "Invalid worker state. Only one worker must be confirmed.",
      });
    }

    const connection = connections[0];

    // 🚫 CHECK IF WORKER ALREADY HAS ACTIVE TASK ON SAME DATE
const taskDate = new Date(task.taskDate).toDateString();

const activeTask = await Task.findOne({
  assignedWorker: connection.worker,
  status: "in_progress",
});

if (activeTask) {
  const activeDate = new Date(activeTask.taskDate).toDateString();

  if (activeDate === taskDate) {
    return res.status(400).json({
      message: "Worker already busy on this date. Try another worker or wait."
    });
  }
}

    const amountToUse = Number(
      connection?.finalBudget || task.budget
    );

    if (!amountToUse || amountToUse <= 0) {
      return res.status(400).json({
        message: "Invalid payment amount",
      });
    }

    const options = {
      amount: amountToUse * 100,
      currency: "INR",
      receipt: "task_" + task._id,
    };

    const order = await razorpay.orders.create(options);

    task.razorpayOrderId = order.id;
    await task.save();

    res.json(order);

  } catch (err) {
    console.error("CREATE ORDER ERROR:", err);
    res.status(500).json({ message: "Task order creation failed" });
  }
});


// ================= TASK VERIFY PAYMENT =================
router.post("/task/verify-payment/:taskId", auth, async (req, res) => {
  try {

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    const task = await Task.findById(req.params.taskId);

    if (!task)
      return res.status(404).json({ message: "Task not found" });

    if (task.provider.toString() !== req.user.userId.toString())
      return res.status(403).json({ message: "Not authorized" });

    if (task.paymentStatus === "paid" || task.escrowStatus === "held") {
      return res.status(400).json({
        message: "Payment already completed for this task",
      });
    }

    if (task.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({
        message: "Order ID mismatch",
      });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature)
      return res.status(400).json({ message: "Invalid signature" });

    const connection = await Connection.findOne({
      task: task._id,
      status: "confirmed",
    });

    const amountToUse = Number(
      connection?.finalBudget || task.budget
    );

    task.budget = amountToUse;

    task.paymentStatus = "paid";
    task.escrowStatus = "held";
    task.status = "in_progress";

// 🔥 MOVE OTHER SAME-DATE CONNECTIONS BACK TO NEGOTIATION

const otherConnections = await Connection.find({
  worker: connection.worker,
  _id: { $ne: connection._id },
}).populate("task");

for (const conn of otherConnections) {

  const connDate = new Date(conn.task.taskDate).toDateString();
  const currentDate = new Date(task.taskDate).toDateString();

  if (connDate === currentDate) {

    conn.status = "accepted"; // back to negotiation
    conn.chatEnabled = true;

    await conn.save();

    // 🔔 notify provider
    const Notification = require("../models/Notification");

    await Notification.create({
      userId: conn.provider,
      title: "Worker Busy",
      message:
        "Worker accepted another job on this date. You can wait or choose another worker.",
      connectionId: conn._id,
      taskId: conn.task._id,
    });

    const io = req.app.get("io");
    io.to(conn.provider.toString()).emit("new_notification");
  }
}

    task.razorpayPaymentId = razorpay_payment_id;

    await WalletTransaction.create({
      user: task.provider,
      relatedUser: task.assignedWorker,
      task: task._id,
      type: "escrow_payment",
      amount: amountToUse,
      description: "Escrow payment locked for task",
    });

    await task.save();

    // 🔥 NOTIFICATION
    const Notification = require("../models/Notification");
    const User = require("../models/User");

    const provider = await User.findById(task.provider);

    await Notification.create({
      userId: task.assignedWorker,
      title: "Payment Completed",
      message: `${provider.name} has completed the payment. You can now start the work.`,
      type: "payment_done",
      taskId: task._id,
      profileImage: provider.profileImage,
    });

    const io = req.app.get("io");
    io.to(task.assignedWorker.toString()).emit("new_notification");

    res.json({ message: "Escrow locked. Work started." });

  } catch (err) {
    console.error("Verify error:", err);
    res.status(500).json({ message: "Task payment verification failed" });
  }
});

module.exports = router;