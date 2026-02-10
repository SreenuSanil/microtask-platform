const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const verifyToken = require("../middleware/authMiddleware"); // ✅ IMPORT ONCE AT TOP
const Otp = require("../models/Otp");
const sendEmail = require("../utils/sendEmail");
const upload = require("../middleware/upload");

// ================= REGISTER =================
router.post(
  "/register",
  (req, res, next) => {
    upload.single("profileImage")(req, res, function (err) {
      if (err) {
        // ✅ FILE TOO LARGE
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            error: "File is more than 2MB",
          });
        }

        // ✅ OTHER MULTER ERRORS
        return res.status(400).json({
          error: err.message || "File upload failed",
        });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      const {
        name,
        email,
        password,
        phone,
        city,
        pincode,
        role,
        skills,
        availability,
        organization,
        taskType,
      } = req.body;

      const profileImage = req.file ? req.file.path : null;

      // BASIC VALIDATION
      if (!name || !email || !password || !phone || !city || !pincode || !role) {
        return res.status(400).json({ error: "All required fields must be filled" });
      }

      if (!["worker", "provider"].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      // 🔐 WORKER PAYMENT CHECK
      let payment = null;
      if (role === "worker") {
        if (!req.body.payment) {
          return res.status(403).json({
            error: "Payment required for worker registration",
          });
        }

        try {
          payment = JSON.parse(req.body.payment);
        } catch {
          return res.status(400).json({ error: "Invalid payment format" });
        }

        if (!payment.orderId || !payment.paymentId || !payment.signature) {
          return res.status(403).json({ error: "Invalid payment data" });
        }
      }

      await User.create({
        name,
        email,
        password: hashedPassword,
        phone,
        city,
        pincode,
        role,
        skills: role === "worker" ? skills : undefined,
        availability: role === "worker" ? availability : undefined,
        organization: role === "provider" ? organization : undefined,
        taskType: role === "provider" ? taskType : undefined,
        profileImage,
        payment:
          role === "worker"
            ? {
                orderId: payment.orderId,
                paymentId: payment.paymentId,
                signature: payment.signature,
                status: "paid",
                paidAt: new Date(),
              }
            : undefined,
        emailVerified: false,
        approvalStatus: role === "worker" ? "pending" : "approved",
      });

      // SEND EMAIL OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      await Otp.deleteMany({ email });
      await Otp.create({
        email,
        otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });

      await sendEmail(email, otp);

      res.status(201).json({
        message: "OTP sent to email. Please verify your email.",
        email,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Registration failed" });
    }
  }
);



// ================= LOGIN =================
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

   
  if (!user.emailVerified) {
    return res.status(403).json({
      error: "Email not verified. Please verify your email first.",
    });
  }

  // 💳 PAYMENT CHECK FOR WORKERS ONLY
if (user.role === "worker") {
  if (!user.payment || user.payment.status !== "paid") {
    return res.status(403).json({
      error: "Payment not completed. Please complete registration payment.",
    });
  }
}



// 🚫 REMOVED USER
if (user.accountStatus === "removed") {
  return res.status(403).json({
    error: "Account removed",
    reason: user.removeReason || "Account permanently removed by admin",
  });
}

// 🚫 BLOCKED USER (WITH AUTO-UNBLOCK)
if (user.accountStatus === "blocked") {
  // ⏰ Auto-unblock if time-based block expired
  if (
    user.blockedUntil &&
    new Date() > new Date(user.blockedUntil)
  ) {
    user.accountStatus = "active";
    user.blockedUntil = null;
    user.blockReason = null;
    await user.save();
  } else {
    let daysLeft = null;

    if (user.blockedUntil) {
      daysLeft = Math.max(
        0,
        Math.ceil(
          (new Date(user.blockedUntil) - new Date()) /
            (1000 * 60 * 60 * 24)
        )
      );
    }

    return res.status(403).json({
      error: "Account blocked",
      reason: user.blockReason || "No reason provided",
      blockedUntil: user.blockedUntil, // date or null
      daysLeft, // number or null
    });
  }
}

  /* 🚫 END BLOCK */

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

res.json({
  token,
  user: {
    id: user._id,
    role: user.role,
    approvalStatus: user.approvalStatus,
    accountStatus: user.accountStatus,
  },
});

});



// ================= CURRENT USER =================
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// ================= FORGOT PASSWORD =================
router.post("/forgot-password", async (req, res) => {
  console.log("FORGOT PASSWORD API HIT");

  try {
    const { email } = req.body;
    console.log("EMAIL:", email);

    const user = await User.findOne({ email });
    if (!user) {
      console.log("USER NOT FOUND");
      return res.status(404).json({ error: "User not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log("OTP GENERATED:", otp);

    await Otp.deleteMany({ email });
    await Otp.create({
      email,
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    console.log("OTP SAVED, SENDING EMAIL...");

    await sendEmail(email, otp);

    console.log("EMAIL SENT SUCCESSFULLY");

    res.json({ message: "OTP sent" });
  } catch (err) {
    console.error("FORGOT PASSWORD ERROR:", err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});



// ================= VERIFY OTP =================
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const otpDoc = await Otp.findOne({ email, otp });
    if (!otpDoc) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    if (otpDoc.expiresAt < new Date()) {
      return res.status(400).json({ error: "OTP expired" });
    }

    res.json({ message: "OTP verified" });
  } catch (error) {
    res.status(500).json({ error: "OTP verification failed" });
  }
});


// ================= RESET PASSWORD =================
router.post("/reset-password", async (req, res) => {
  try {
    const { email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.findOneAndUpdate(
      { email },
      { password: hashedPassword }
    );

    await Otp.deleteMany({ email });

    res.json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ error: "Password reset failed" });
  }
});

// ================= VERIFY EMAIL OTP =================
router.post("/verify-email", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const otpDoc = await Otp.findOne({ email, otp });
    if (!otpDoc) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    if (otpDoc.expiresAt < new Date()) {
      return res.status(400).json({ error: "OTP expired" });
    }

    // mark email verified
    await User.findOneAndUpdate(
      { email },
      {
        emailVerified: true,
        emailVerifiedAt: new Date(),
      }
    );

    // cleanup
    await Otp.deleteMany({ email });

    res.json({ message: "Email verified successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Email verification failed" });
  }
});

// ================= RESEND EMAIL OTP =================
router.post("/resend-email-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.emailVerified) {
      return res.status(400).json({ error: "Email already verified" });
    }

    // generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log("RESEND OTP:", otp);

    // delete old OTPs
    await Otp.deleteMany({ email });

    // save new OTP
    await Otp.create({
      email,
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    // send email
    await sendEmail(email, otp);

    res.json({ message: "OTP resent successfully" });
  } catch (error) {
    console.error("RESEND OTP ERROR:", error);
    res.status(500).json({ error: "Failed to resend OTP" });
  }
});




module.exports = router;
