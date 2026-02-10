const Task = require("../models/Task");

exports.createTask = async (req, res) => {
  try {
    const {
      title,
      category,
      description,
      city,
      pincode,
      taskDate,
      timeSlot,
      budget,
      urgency,
    } = req.body;

    if (
      !title ||
      !category ||
      !description ||
      !city ||
      !pincode ||
      !taskDate ||
      !timeSlot ||
      !budget
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const task = await Task.create({
      provider: req.user.userId,
      title,
      category,
      description,
      city,
      pincode,
      taskDate,
      timeSlot,
      budget,
      urgency,
    });

    res.status(201).json({
      message: "Task posted successfully",
      task,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create task" });
  }
};
