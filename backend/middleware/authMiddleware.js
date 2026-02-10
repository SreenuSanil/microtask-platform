const jwt = require("jsonwebtoken");
const User = require("../models/User");

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    /* 🚫 BLOCKED USER */
if (user.accountStatus === "blocked") {
  // ⏰ Auto-unblock if time expired
  if (user.blockedUntil && new Date() > new Date(user.blockedUntil)) {
    user.accountStatus = "active";
    user.blockedUntil = null;
    user.blockReason = null;
    await user.save();
  } else {
    let remainingDays = null;

    if (user.blockedUntil) {
      const diffMs = new Date(user.blockedUntil) - new Date();
      remainingDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      remainingDays = Math.max(0, remainingDays);
    }

    return res.status(403).json({
      error: "Account blocked",
      reason: user.blockReason || "No reason provided",
      blockedUntil: user.blockedUntil, // null = permanent
      remainingDays: remainingDays,    // number or null
    });
  }
}




    /* ❌ REMOVED USER */
    if (user.accountStatus === "removed") {
      return res.status(403).json({
        error: "Account removed",
      });
    }

    req.user = {
      userId: user._id,
      role: user.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

module.exports = verifyToken;
