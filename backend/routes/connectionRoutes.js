const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const Connection = require("../models/Connection");
const Task = require("../models/Task");

const {
  sendConnectionRequest,
  checkConnection,
  acceptConnection,
  rejectConnection,
  closeConnection,
  getWorkerInvitations,
  getMyChats,
  getProviderInvites 

} = require("../controllers/connectionController");

router.post("/request", protect, sendConnectionRequest);
router.get("/check", protect, checkConnection);
router.get("/worker-invitations", protect, getWorkerInvitations);

router.patch("/:id/accept", protect, acceptConnection);
router.patch("/:id/reject", protect, rejectConnection);
router.patch("/:id/close", protect, closeConnection);
router.get("/my-chats", protect, getMyChats);
router.get("/provider-invites", protect, getProviderInvites);
router.patch("/confirm/:connectionId", protect, async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.connectionId)
      .populate("task");

    if (!connection) {
      return res.status(404).json({ message: "Connection not found" });
    }

    // ✅ Only provider can confirm
    if (connection.provider.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ message: "Only provider can confirm" });
    }

    if (connection.status !== "accepted") {
      return res.status(400).json({ message: "Invalid status" });
    }

    // 🔒 Lock budget
    connection.status = "provider_confirmed";
    connection.budgetConfirmed = true;
    connection.finalBudget = connection.task.budget; // default original

    await connection.save();

    res.json({ message: "Job confirmed" });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.patch("/worker-confirm/:id", protect, async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.id);

    if (!connection)
      return res.status(404).json({ message: "Connection not found" });

    if (connection.worker.toString() !== req.user.userId.toString())
      return res.status(403).json({ message: "Not authorized" });

    if (connection.status !== "provider_confirmed")
      return res.status(400).json({ message: "Invalid status" });

    //  Update connection
    connection.status = "confirmed";
    await connection.save();

    const task = await Task.findById(connection.task);

    if (!task)
      return res.status(404).json({ message: "Task not found" });

    task.status = "assigned";
    task.assignedWorker = req.user.userId;

    await task.save();

    console.log("✅ Task Assigned Successfully");

    res.json({ message: "Work started" });

  } catch (err) {
    console.error("Worker confirm error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
module.exports = router;
