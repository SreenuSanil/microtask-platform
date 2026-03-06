const express = require("express");
const router = express.Router();
const User = require("../models/User");
const auth = require("../middleware/authMiddleware");
const protect = require("../middleware/authMiddleware");

const {
  updateWorkerProfile,
  changePassword
} = require("../controllers/updateWorkerProfile");

// ================= NEARBY WORKERS =================
router.get("/nearby-workers", async (req, res) => {
  try {
    const { latitude, longitude, radius } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        error: "Latitude and longitude required",
      });
    }

    const maxDistance = radius ? parseInt(radius) * 1000 : 5000; // default 5km

    const workers = await User.find({
      role: "worker",
      approvalStatus: "approved",
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [
              parseFloat(longitude), // longitude FIRST
              parseFloat(latitude),  // latitude SECOND
            ],
          },
          $maxDistance: maxDistance,
        },
      },
    }).select("-password");

    res.json(workers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch nearby workers" });
  }
});


router.get("/find-workers", auth, async (req, res) => {
  try {
    const {
      skill,
      latitude,
      longitude,
      radius = 10,
      urgent = "false",
      limit = 5,
    } = req.query;

    if (!skill || !latitude || !longitude) {
      return res.status(400).json({ message: "Missing parameters" });
    }

    const parsedRadius = Number(radius) * 1000; // km → meters

    const workers = await User.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [Number(longitude), Number(latitude)],
          },
          distanceField: "distance",
          maxDistance: parsedRadius,
          spherical: true,
          query: {
            role: "worker",
            approvalStatus: "approved",
            accountStatus: "active",
            skills: { $in: [skill.toLowerCase()] },
            ...(urgent === "true"
              ? {
                  isAvailable: true,
                  availableUntil: { $gte: new Date() },
                }
              : {}),
          },
        },
      },
      {
        $addFields: {
          finalScore: {
            $cond: [
              { $eq: ["$ratingCount", 0] },
              "$rating",
              {
                $add: [
                  { $multiply: ["$ratingAverage", 0.8] },
                  { $multiply: ["$rating", 0.2] },
                ],
              },
            ],
          },
        },
      },
      {
        $sort: {
          finalScore: -1,
          distance: 1,
        },
      },
      {
        $limit: Number(limit),
      },
      {
        $project: {
          name: 1,
          skills: 1,
          rating: 1,
          ratingAverage: 1,
          completedTasks: 1,
          distance: 1,
          profileImage: 1,
        },
      },
    ]);

    res.json(workers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});
// ================= TOGGLE WORKER AVAILABILITY =================
router.patch("/toggle-availability", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user || user.role !== "worker") {
      return res.status(403).json({ message: "Only workers can toggle availability" });
    }

    // If currently available → turn OFF
    if (user.isAvailable) {
      user.isAvailable = false;
      user.availableUntil = null;
    } 
    // If currently unavailable → turn ON for 48 hours
    else {
      user.isAvailable = true;
      user.availableUntil = new Date(Date.now() + 48 * 60 * 60 * 1000);
    }

    await user.save();

    res.json({
      isAvailable: user.isAvailable,
      availableUntil: user.availableUntil,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to toggle availability" });
  }
});
router.put("/worker-profile", protect, updateWorkerProfile);
router.patch("/change-password", protect, changePassword);
module.exports = router;
