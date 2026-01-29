const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs"); // ✅ import ONCE
const User = require("../models/User");
const jwt = require("jsonwebtoken");



// ================= REGISTER =================
router.post("/register", async (req, res) => {
  try {
    const { password } = req.body;

    // WHY: never store plain passwords
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      ...req.body,
      password: hashedPassword,
    });

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});


// ================= LOGIN =================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // WHY: check email first
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // WHY: compare hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // WHY: frontend needs role for redirect
    const token = jwt.sign(
  {
    userId: user._id,
    role: user.role,
  },
  process.env.JWT_SECRET,
  { expiresIn: "1d" }
);

   res.json({
   message: "Login successful",
   token,
   role: user.role,
});

  } catch (error) {
    console.error(error); // 🔥 show real error in terminal
    res.status(500).json({ error: "Server error" });
  }
});

const verifyToken = require("../middleware/authMiddleware");

// ================= CURRENT USER =================
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});


module.exports = router;
