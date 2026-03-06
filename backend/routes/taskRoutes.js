const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const Task = require("../models/Task");
const multer = require("multer");
const User = require("../models/User");
const Message = require("../models/Message");

const storage = multer.diskStorage({
  destination: "uploads/tasks",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

const storageCompletion = multer.diskStorage({
  destination: "uploads/completions",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const uploadCompletion = multer({ storage: storageCompletion });

// Create Task
router.post("/", auth, upload.array("images", 3), async (req, res) => {

  try {
    const {
      title,
      description,
      requiredSkill,

      city,
      pincode,
      taskDate,
      budget,
      urgency,
      latitude,
      longitude,
      houseName,
      area,
      landmark,
      instructions,

    } = req.body;

    const imagePaths = req.files
  ? req.files.map((file) => file.path)
  : [];


const newTask = new Task({
  provider: req.user.userId,
  title,
  requiredSkill,
  description,
  taskDate,
  budget,
  urgency,
  images: imagePaths,

  location: {
    type: "Point",
    coordinates: [Number(longitude), Number(latitude)],
  },

  siteAddress: {
    houseName,
    area,
    landmark,
    instructions,
  },
});


    await newTask.save();

    res.status(201).json({ message: "Task posted successfully" });
  } catch (error) {
    console.error("TASK ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET My Tasks (Provider)
router.get("/my-tasks", auth, async (req, res) => {
  try {

    const tasks = await Task.find({
  provider: req.user.userId,
})
.populate("provider", "name profileImage")
.populate("assignedWorker", "name profileImage")
.sort({ createdAt: -1 });


    res.json(tasks);
    
  } catch (error) {
    console.error("FETCH TASK ERROR:", error);
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
});



router.delete("/:id", auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task)
      return res.status(404).json({ message: "Task not found" });

    if (task.provider.toString() !== req.user.userId.toString())
      return res.status(403).json({ message: "Not authorized" });

    await task.deleteOne();

    res.json({ message: "Task deleted permanently" });

  } catch (error) {
    console.error("DELETE ERROR:", error);
    res.status(500).json({ message: "Delete failed" });
  }
});

// GET Worker Tasks
router.get("/worker-tasks", auth, async (req, res) => {
  try {
    console.log("🔥 Worker Tasks Route Hit");
    console.log("User ID:", req.user.userId);

    const tasks = await Task.find({
      assignedWorker: req.user.userId,
    })
      .populate("provider", "name profileImage")
      .sort({ createdAt: -1 });

    console.log("Tasks Found:", tasks);

    res.json(tasks);

  } catch (err) {
    console.error("❌ Worker Tasks Error:", err);
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
});

router.get("/:id", auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) return res.status(404).json({ message: "Task not found" });

    res.json(task);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});


// UPDATE TASK
router.put("/:id", auth, upload.array("images", 3), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task)
      return res.status(404).json({ message: "Task not found" });

    if (task.provider.toString() !== req.user.userId.toString())
      return res.status(403).json({ message: "Not authorized" });

    const {
      title,
      description,
      requiredSkill,
      taskDate,
      budget,
      urgency,
      latitude,
      longitude,
      houseName,
      area,
      landmark,
      instructions,
    } = req.body;

    // Update fields
    task.title = title;
    task.description = description;
    task.requiredSkill = requiredSkill;
    task.taskDate = taskDate;
    task.budget = budget;
    task.urgency = urgency;

task.siteAddress = {
  houseName,
  area,
  landmark,
  instructions,
};


    if (latitude && longitude) {
      task.location = {
        type: "Point",
        coordinates: [Number(longitude), Number(latitude)],
      };
    }

    // If new images uploaded
    if (req.files && req.files.length > 0) {
      task.images = req.files.map(file => file.path);
    }

    await task.save();

    res.json({ message: "Task updated successfully" });

  } catch (error) {
    console.error("UPDATE ERROR:", error);
    res.status(500).json({ message: "Update failed" });
  }
});

router.patch("/cancel-ongoing/:taskId", auth, async (req, res) => {
  try {

    const task = await Task.findById(req.params.taskId);

    if (!task)
      return res.status(404).json({ message: "Task not found" });

    if (task.status !== "in_progress")
      return res.status(400).json({
        message: "Only ongoing tasks can be cancelled"
      });

   

   const userId = req.user.userId;

const isWorker =
  task.assignedWorker && task.assignedWorker.equals(userId);

const isProvider =
  task.provider && task.provider.equals(userId);

if (!isWorker && !isProvider) {
  return res.status(403).json({ message: "Not allowed" });
}

    task.status = "cancelled";
    await task.save();

    await Message.deleteMany({ task: task._id });

    res.json({ message: "Task cancelled successfully" });

  } catch (err) {
    console.error("CANCEL TASK ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.patch("/reject/:taskId", auth, async (req, res) => {
  try {

    const { reason } = req.body;

    const task = await Task.findById(req.params.taskId);

    if (!task)
      return res.status(404).json({ message: "Task not found" });

    // Only provider can reject
    if (task.provider.toString() !== req.user.userId.toString())
      return res.status(403).json({ message: "Not authorized" });

    if (task.status !== "pending_verification")
      return res.status(400).json({
        message: "Task is not awaiting verification",
      });

    // Send task back to worker
    task.status = "in_progress";

    task.rejectionReason = reason || "Work not satisfactory";

    task.rejectedAt = new Date();

    // remove old completion image
    task.completionImage = null;

    await task.save();

    res.json({
      message: "Work rejected. Sent back to worker.",
      task,
    });

  } catch (err) {
    console.error("REJECT WORK ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.patch("/raise-dispute/:taskId", auth, async (req, res) => {
  try {

    const { reason } = req.body;

    const task = await Task.findById(req.params.taskId);

    if (!task)
      return res.status(404).json({ message: "Task not found" });

    const userId = req.user.userId;

    const isWorker =
      task.assignedWorker &&
      task.assignedWorker.toString() === userId.toString();

    const isProvider =
      task.provider &&
      task.provider.toString() === userId.toString();

    if (!isWorker && !isProvider)
      return res.status(403).json({ message: "Not authorized" });

    task.status = "dispute";

    task.dispute = {
      raisedBy: isWorker ? "worker" : "provider",
      reason: reason || "Dispute raised",
      raisedAt: new Date(),
      status: "open"
    };

    await task.save();

    res.json({
      message: "Dispute raised successfully",
      task
    });

  } catch (err) {
    console.error("DISPUTE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.patch(
  "/mark-complete/:taskId",
  auth,
  uploadCompletion.single("completionImage"),
  async (req, res) => {
    try {
      const task = await Task.findById(req.params.taskId);

      if (!task)
        return res.status(404).json({ message: "Task not found" });

      if (!task.assignedWorker)
        return res.status(400).json({ message: "No worker assigned" });

      if (task.assignedWorker.toString() !== req.user.userId.toString())
        return res.status(403).json({ message: "Not authorized" });

      if (task.status !== "in_progress")
        return res.status(400).json({ message: "Task not in progress" });

      task.status = "pending_verification";
      task.completedAt = new Date();

      if (req.file) {
        task.completionImage = req.file.path;
      }

      await task.save();

      res.json({
        message: "Task submitted for provider verification",
      });

    } catch (err) {
      console.error("MARK COMPLETE ERROR:", err);
      res.status(500).json({ message: err.message });
    }
  }
);

router.patch("/:taskId/accept", auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);

    if (!task) 
      return res.status(404).json({ message: "Task not found" });

    if (!task.assignedWorker)
      return res.status(400).json({ message: "No worker assigned" });

    if (task.assignedWorker.toString() !== req.user.userId.toString())
      return res.status(403).json({ message: "Not authorized" });

    task.status = "accepted";
    await task.save();

    res.json({ message: "Task accepted", task });

  } catch (err) {
    res.status(500).json({ message: "Error accepting task" });
  }
});


router.patch("/approve/:taskId", auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);

    if (!task)
      return res.status(404).json({ message: "Task not found" });

    // Only provider can approve
    if (task.provider.toString() !== req.user.userId.toString())
      return res.status(403).json({ message: "Not authorized" });

    if (task.status !== "pending_verification")
      return res.status(400).json({ message: "Task not awaiting verification" });

    if (task.escrowStatus !== "held")
      return res.status(400).json({ message: "Escrow not locked" });

    // Release payment
    task.status = "completed";
    task.escrowStatus = "released";
    task.verifiedAt = new Date();

    await task.save();

    const WalletTransaction = require("../models/WalletTransaction");
    const User = require("../models/User");

    await WalletTransaction.create({
      user: task.assignedWorker,
      relatedUser: task.provider,
      task: task._id,
      type: "task_payment_release",
      amount: task.budget,
      description: "Payment released for completed task",
    });

  const worker = await User.findById(task.assignedWorker);

// increase total completed jobs
worker.completedTasks += 1;

// increase skill-specific jobs
const skill = task.requiredSkill.toLowerCase();

let skillJob = worker.skillCompletedTasks.find(
  s => s.skill === skill
);

if (!skillJob) {
  worker.skillCompletedTasks.push({
    skill: skill,
    count: 1
  });
} else {
  skillJob.count += 1;
}

await worker.save();

    res.json({ message: "Task approved and payment released" });

  } catch (err) {
    console.error("APPROVE TASK ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/rate-worker/:taskId", auth, async (req, res) => {
  try {

    const { rating, comment } = req.body;

    const task = await Task.findById(req.params.taskId);

    if (!task)
      return res.status(404).json({ message: "Task not found" });

    // Only provider can rate
    if (task.provider.toString() !== req.user.userId.toString())
      return res.status(403).json({ message: "Not authorized" });

    if (task.status !== "completed")
      return res.status(400).json({ message: "Task not completed yet" });

    const worker = await User.findById(task.assignedWorker);

    const skill = task.requiredSkill.toLowerCase();

    let skillRating = worker.skillRatings.find(
      s => s.skill === skill
    );

    // If worker has no rating for this skill yet
    if (!skillRating) {
      skillRating = {
        skill: skill,
        rating: rating,
        ratingAverage: rating,
        ratingCount: 1
      };

      worker.skillRatings.push(skillRating);

    } else {

      skillRating.rating += rating;
      skillRating.ratingCount += 1;

      skillRating.ratingAverage =
        skillRating.rating / skillRating.ratingCount;
    }

    // Save review
    worker.reviews.push({
      user: req.user.name,
      rating,
      comment
    });

    await worker.save();

    res.json({ message: "Rating submitted successfully" });

  } catch (err) {
    console.error("RATING ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
