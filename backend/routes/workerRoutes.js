const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const User = require("../models/User");
const {
  getMyNotifications,
} = require("../controllers/notificationController");


// ============================
// Toggle Availability
// ============================
router.patch("/availability", auth, async (req, res) => {
  try {
    const worker = await User.findById(req.user.userId);

    if (!worker || worker.role !== "worker") {
      return res.status(403).json({ message: "Access denied" });
    }

    // If currently available and not expired → turn OFF
    if (
      worker.isAvailable &&
      worker.availableUntil &&
      worker.availableUntil > new Date()
    ) {
      worker.isAvailable = false;
      worker.availableUntil = null;
    } else {
      // Turn ON for 2 days
      worker.isAvailable = true;

      const twoDaysLater = new Date();
      twoDaysLater.setDate(twoDaysLater.getDate() + 2);

      worker.availableUntil = twoDaysLater;
    }

    await worker.save();

    res.json({
      message: "Availability updated",
      isAvailable: worker.isAvailable,
      availableUntil: worker.availableUntil,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ============================
// ✅ SMART WORKER SEARCH ROUTE (FINAL VERSION)
// ============================
router.post("/search", auth, async (req, res) => {
  try {
    const {
      skill,
      lat,
      lng,
      radius = 20000,
      urgency,
      limit = 5,
      skip = 0,
    } = req.body;

    if (!skill || !lat || !lng) {
      return res.status(400).json({ message: "Missing search data" });
    }

    const baseQuery = {
      role: "worker",
      approvalStatus: "approved",
       skills: { $in: [skill.toLowerCase()] },
    };

    if (urgency === "urgent") {
      baseQuery.isAvailable = true;
      baseQuery.availableUntil = { $gt: new Date() };
    }

    const workers = await User.aggregate([
      // ✅ MUST BE FIRST STAGE
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [lng, lat],
          },
          distanceField: "distance",
          maxDistance: radius,
          spherical: true,
          query: baseQuery,
        },
      },

      // Interview rating extraction
      {
        $addFields: {
          interviewRating: {
            $let: {
              vars: {
                matchedSkill: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$skillRatings",
                        as: "sr",
                        cond: { $eq: ["$$sr.skill", skill.toLowerCase()] }
                      }
                    },
                    0
                  ]
                }
              },
              in: { $ifNull: ["$$matchedSkill.ratingAverage", 0] }
            }
          }
        }
      },

      {
        $addFields: {
          qualityScore: {
            $add: [
              { $multiply: ["$interviewRating", 0.35] },
              { $multiply: ["$overallRating", 0.45] }
            ]
          }
        }
      },

     {
  $addFields: {
    skillJobData: {
      $arrayElemAt: [
        {
          $filter: {
            input: "$skillCompletedTasks",
            as: "sc",
            cond: { $eq: ["$$sc.skill", skill.toLowerCase()] }
          }
        },
        0
      ]
    }
  }
},
{
  $addFields: {
    skillCompletedJobs: {
      $ifNull: ["$skillJobData.count", 0]
    }
  }
},

{
  $addFields: {
    weightedRating: {
      $add: [
        {
          $multiply: [
            { $divide: ["$skillCompletedJobs", { $add: ["$skillCompletedJobs", 10] }] },
            "$overallRating"
          ]
        },
        {
          $multiply: [
            { $divide: [10, { $add: ["$skillCompletedJobs", 10] }] },
            4
          ]
        }
      ]
    }
  }
},

      {
        $addFields: {
          experienceWeight: {
            $ln: { $add: ["$skillCompletedJobs", 1] }
          }
        }
      },

      {
        $addFields: {
          newWorkerBoost: {
            $cond: {
              if: { $lt: ["$skillCompletedJobs", 5] },
              then: { $divide: [1, { $add: ["$skillCompletedJobs", 1] }] },
              else: 0
            }
          }
        }
      },

      {
        $addFields: {
          complaintPenalty: {
            $multiply: ["$complaintCount", 0.5]
          }
        }
      },

      {
        $addFields: {
          dynamicScore: {
            $subtract: [
              {
                $add: [
                  { $multiply: ["$weightedRating", 2] },
                  "$experienceWeight",
                  "$newWorkerBoost"
                ]
              },
              "$complaintPenalty"
            ]
          }
        }
      },

      { $sort: { dynamicScore: -1 } }
    ]);

    // 🔥 Rotate top 3 only on first page
    let finalWorkers = workers;

    if (skip === 0 && finalWorkers.length >= 3) {
      const topThree = finalWorkers.slice(0, 3);
      const rest = finalWorkers.slice(3);

      for (let i = topThree.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [topThree[i], topThree[j]] = [topThree[j], topThree[i]];
      }

      finalWorkers = [...topThree, ...rest];
    }

    const paginated = finalWorkers.slice(skip, skip + limit);

    res.json(paginated);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ============================
// GET FULL WORKER PROFILE
// ============================
router.get("/:workerId", async (req, res) => {
  try {
    const worker = await User.findById(req.params.workerId)
      .select("-password");

    if (!worker || worker.role !== "worker") {
      return res.status(404).json({ message: "Worker not found" });
    }

    res.json(worker);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
