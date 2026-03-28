const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const User = require("../models/User");
const Task = require("../models/Task");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: "uploads/reviews",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

router.post("/add", auth, upload.single("image"), async (req, res) => {

  try {

    const { workerId, rating, comment, taskId, skill } = req.body;

    const image = req.file ? req.file.path : null;

    const worker = await User.findById(workerId);
    const task = await Task.findById(taskId);

    if (!worker) {
      return res.status(404).json({ message: "Worker not found" });
    }

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (task.provider.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (!task.assignedWorker || task.assignedWorker.toString() !== workerId.toString()) {
      return res.status(400).json({ message: "Worker mismatch" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5"
      });
    }

   const existing = worker.reviews.find(
  r => r.task && r.task.toString() === taskId
);

if (existing) {
  return res.status(400).json({
    message: "Already reviewed"
  });
}

const numericRating = Number(rating);
const skillName = skill.toLowerCase();

// ✅ PUSH REVIEW FIRST
worker.reviews.push({
  user: req.user.userId,
  rating: numericRating,
  comment,
  skill: skillName,
  task: taskId,
  image
});

// ✅ REBUILD SKILL RATING
const skillReviews = worker.reviews.filter(
  r => r.skill === skillName
);

const total = skillReviews.reduce((sum, r) => sum + Number(r.rating), 0);
const avg = total / skillReviews.length;

// find or create
let skillRating = worker.skillRatings.find(
  s => s.skill === skillName
);

if (!skillRating) {
  worker.skillRatings.push({
    skill: skillName,
    ratingAverage: avg,
    ratingCount: skillReviews.length
  });
} else {
  skillRating.ratingAverage = avg;
  skillRating.ratingCount = skillReviews.length;
}

// 🔥 FORCE UPDATE
worker.markModified("skillRatings");

await worker.save();

    res.json({ message: "Review added" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }

});

router.get("/my-reviews", auth, async (req,res)=>{

  try{

    const workers = await User.find({ "reviews.user": req.user.userId });

    const reviewedTasks = [];

    workers.forEach(w => {

      w.reviews.forEach(r => {

        if (r.user && r.user.toString() === req.user.userId.toString()) {
          reviewedTasks.push(r.task.toString());
        }

      });

    });

    res.json(reviewedTasks);

  }catch(err){
    console.error(err);
    res.status(500).json({message:"Server error"});
  }

});

module.exports = router;