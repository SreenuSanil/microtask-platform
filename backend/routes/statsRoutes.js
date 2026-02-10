const express = require("express");
const router = express.Router();
const User = require("../models/User");

router.get("/counts", async (req, res) => {
  try {
    // ✅ Only approved workers are active
    const workers = await User.countDocuments({
      role: "worker",
      approvalStatus: "approved",
    });

    // Providers are always active
    const providers = await User.countDocuments({
      role: "provider",
    });

    res.json({ workers, providers });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
