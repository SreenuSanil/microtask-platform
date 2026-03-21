const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const auth = require("../middleware/authMiddleware");
const Task = require("../models/Task");
const router = express.Router();
const Connection = require("../models/Connection");
const Settings = require("../models/Settings");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ================= CREATE ORDER =================
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
    res.status(500).json({ error: "Order creation failed" });
  }
});

// ================= VERIFY PAYMENT =================
router.post("/verify-payment", (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = req.body;

  const body =
    razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature === razorpay_signature) {
    return res.json({
      success: true,
      payment: {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
      },
    });
  } else {
    return res.status(400).json({
      success: false,
      error: "Invalid payment signature",
    });
  }
});




router.post("/task/create-order/:taskId", auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);

    if (!task)
      return res.status(404).json({ message: "Task not found" });

    if (task.paymentStatus === "paid") {
      return res.status(400).json({
        message: "Payment already verified"
      });
    }

    const connection = await Connection.findOne({
      task: task._id,
      status: "confirmed"
    });

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

    // ✅ SAVE ORDER ID
    task.razorpayOrderId = order.id;
    await task.save();

    res.json(order);

  } catch (err) {
    console.error("CREATE ORDER FULL ERROR:", err);
    res.status(500).json({ message: "Task order creation failed" });
  }
});


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

/* 🚫 Prevent duplicate payment */
if (task.paymentStatus === "paid" || task.escrowStatus === "held") {
  return res.status(400).json({
    message: "Payment already completed for this task",
  });
}

if (task.razorpayOrderId !== razorpay_order_id) {
  return res.status(400).json({
    message: "Order ID mismatch"
  });
}

    if (!task)
      return res.status(404).json({ message: "Task not found" });

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature)
      return res.status(400).json({ message: "Invalid signature" });

const connection = await Connection.findOne({
  task: task._id,
  status: "confirmed"
}).lean();

const amountToUse = Number(
  connection?.finalBudget || task.budget
);

task.paymentStatus = "paid";
task.escrowStatus = "held";
task.status = "in_progress";
task.razorpayPaymentId = razorpay_payment_id;

const WalletTransaction = require("../models/WalletTransaction");

await WalletTransaction.create({
  user: task.provider,
  relatedUser: task.assignedWorker,
  task: task._id,
  type: "escrow_payment",
  amount: amountToUse,
  description: "Escrow payment locked for task",
});


    task.status = "in_progress";
    task.razorpayPaymentId = razorpay_payment_id;

    await task.save();

    res.json({ message: "Escrow locked. Work started." });

  } catch (err) {
    console.error("Verify error:", err);
    res.status(500).json({ message: "Task payment verification failed" });
  }
});

module.exports = router;
