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

    worker.reviews.push({
      user: req.user.userId,
      rating,
      comment,
      skill: skill.toLowerCase(),
      task: taskId,
      image
    });

    worker.ratingCount += 1;

    worker.overallRating =
      ((worker.overallRating * (worker.ratingCount - 1)) + rating)
      / worker.ratingCount;

    const skillName = skill.toLowerCase();

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