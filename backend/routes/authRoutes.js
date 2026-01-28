const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs"); // ✅ import ONCE
const User = require("../models/User");


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
    res.json({
      message: "Login successful",
      role: user.role,
    });
  } catch (error) {
    console.error(error); // 🔥 show real error in terminal
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
