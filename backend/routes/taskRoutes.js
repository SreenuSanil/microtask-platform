const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const Task = require("../models/Task");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: "uploads/tasks",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

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




module.exports = router;
