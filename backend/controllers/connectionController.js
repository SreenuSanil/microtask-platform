const Connection = require("../models/Connection");
const Task = require("../models/Task");
const Notification = require("../models/Notification");
const Message = require("../models/Message");

/* =========================
   SEND CONNECTION REQUEST
========================= */
exports.sendConnectionRequest = async (req, res) => {
  try {
    const { taskId, workerId } = req.body;

    // Check duplicate request
    const existing = await Connection.findOne({
      task: taskId,
      worker: workerId,
      provider: req.user.userId,
    });

    if (existing) {
      return res.status(400).json({ message: "Already requested" });
    }

    //  LIMIT TO 3 WORKERS
    const existingCount = await Connection.countDocuments({
      task: taskId,
      provider: req.user.userId,
    });

    if (existingCount >= 3) {
      return res.status(400).json({
        message: "You can invite only 3 workers per task",
      });
    }

    // CREATE CONNECTION
    const connection = await Connection.create({
      task: taskId,
      provider: req.user.userId,
      worker: workerId,
    });

    res.json(connection);

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
/* =========================
   CHECK CONNECTION
========================= */
exports.checkConnection = async (req, res) => {
  try {

    const { taskId, workerId } = req.query;

    const connection = await Connection.findOne({
      task: taskId,
      worker: workerId,
      provider: req.user.userId,
    });

    if (connection) {
      return res.json({ exists: true });
    }

    res.json({ exists: false });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};


/* =========================
   ACCEPT CONNECTION
========================= */
exports.acceptConnection = async (req, res) => {
  try {

    const connection = await Connection.findById(req.params.id)
      .populate("task");

    if (!connection)
      return res.status(404).json({ message: "Connection not found" });

    if (connection.status !== "pending")
      return res.status(400).json({ message: "Invalid status" });

    const task = await Task.findById(connection.task._id);

    if (task.status !== "open")
      return res.status(400).json({ message: "Task already assigned" });

    // same-date check
    const taskDate = connection.task.taskDate;

    const existingAccepted = await Connection.findOne({
      worker: req.user.userId,
      status: "accepted"
    }).populate("task");

    if (existingAccepted) {

      const existingDate = new Date(existingAccepted.task.taskDate).toDateString();
      const newDate = new Date(taskDate).toDateString();

      if (existingDate === newDate) {
        return res.status(400).json({
          message: "You already accepted another task on this date."
        });
      }
    }

    // active task check
    const activeTask = await Task.findOne({
      assignedWorker: req.user.userId,
      status: { $in: ["assigned", "in_progress"] },
    });

    if (activeTask) {
      return res.status(400).json({
        message: "Finish current task before accepting another"
      });
    }

    connection.status = "accepted";
    connection.chatEnabled = true;

    await connection.save();

    const removedConnections = await Connection.find({
  task: connection.task._id,
  _id: { $ne: connection._id }
});

    await Connection.deleteMany({
  task: connection.task._id,
  _id: { $ne: connection._id } 
});

const io = req.app.get("io");

removedConnections.forEach((conn) => {
  io.to(conn.worker.toString()).emit("job_taken", {
    taskId: connection.task._id,
    message: "Position filled by another worker",
  });
});

    await Notification.create({
      userId: connection.provider,
      title: "Invitation Accepted",
      message: "A worker accepted your invitation",
    });

    res.json({ message: "Negotiation started" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


/* =========================
   REJECT CONNECTION
========================= */
exports.rejectConnection = async (req, res) => {
  try {

    const connection = await Connection.findById(req.params.id);

    if (!connection)
      return res.status(404).json({ message: "Connection not found" });

    if (connection.worker.toString() !== req.user.userId)
      return res.status(403).json({ message: "Not authorized" });

    connection.status = "rejected";

    await connection.save();

    res.json({ message: "Invitation rejected" });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};


/* =========================
   CLOSE CONNECTION
========================= */
exports.closeConnection = async (req, res) => {
  try {

    const connection = await Connection.findById(req.params.id);

    if (!connection)
      return res.status(404).json({ message: "Connection not found" });

    connection.status = "closed";

    await connection.save();

    res.json({ message: "Negotiation closed" });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};


/* =========================
   WORKER INVITATIONS
========================= */
exports.getWorkerInvitations = async (req, res) => {
  try {

    const invitations = await Connection.find({
      worker: req.user.userId,
      status: { $in: ["pending", "accepted"] }
    })
      .populate("provider", "name profileImage")
      .populate("task");

    res.json(invitations);

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};


/* =========================
   PROVIDER INVITES
========================= */
exports.getProviderInvites = async (req, res) => {
  try {

    const invites = await Connection.find({
      provider: req.user.userId,
      status: { $in: ["pending", "accepted"] }
    })
      .populate("worker", "name profileImage skills skillRatings")
      .populate("task", "requiredSkill");

    res.json(invites);

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};


/* =========================
   GET MY CHATS
========================= */
exports.getMyChats = async (req, res) => {
  try {

    const chats = await Connection.find({
      $or: [
        { worker: req.user.userId },
        { provider: req.user.userId }
      ],
      chatEnabled: true
    })
      .populate("provider", "name profileImage")
      .populate("worker", "name profileImage skills skillRatings")
      .populate("task");

    const chatsWithUnread = await Promise.all(
      chats.map(async (chat) => {

        const unread = await Message.countDocuments({
          connection: chat._id,
          isRead: false,
          sender: { $ne: req.user.userId },
        });

        return {
          ...chat.toObject(),
          unreadCount: unread,
          taskStatus: chat.task?.status,
          paymentStatus: chat.task?.paymentStatus,
        };

      })
    );

    res.json(chatsWithUnread);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


/* =========================
   PROVIDER CONFIRM
========================= */
exports.confirmConnection = async (req, res) => {
  try {

    const connection = await Connection.findById(req.params.connectionId)
      .populate("task");

    if (!connection)
      return res.status(404).json({ message: "Connection not found" });

    if (connection.provider.toString() !== req.user.userId.toString())
      return res.status(403).json({ message: "Only provider can confirm" });

    if (connection.status !== "accepted")
      return res.status(400).json({ message: "Invalid status" });

    connection.status = "provider_confirmed";
    connection.budgetConfirmed = true;

    if (!connection.finalBudget)
      connection.finalBudget = connection.task.budget;

    await connection.save();

    res.json({ message: "Job confirmed" });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};


/* =========================
   WORKER CONFIRM
========================= */
exports.workerConfirm = async (req, res) => {
  try {

    const connection = await Connection.findById(req.params.id);

    if (!connection)
      return res.status(404).json({ message: "Connection not found" });

    if (connection.worker.toString() !== req.user.userId.toString())
      return res.status(403).json({ message: "Not authorized" });

    if (connection.status !== "provider_confirmed")
      return res.status(400).json({ message: "Invalid status" });

    connection.status = "confirmed";
    await connection.save();

    const task = await Task.findById(connection.task);

    task.status = "assigned";
    task.assignedWorker = req.user.userId;

    await task.save();

    res.json({ message: "Work started" });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};


/* =========================
   UPDATE BUDGET
========================= */
exports.updateBudget = async (req, res) => {
  try {

    const { newAmount } = req.body;

    const connection = await Connection.findById(req.params.id)
      .populate("task");

    if (!connection)
      return res.status(404).json({ message: "Connection not found" });

   if (connection.provider.toString() !== req.user.userId.toString())
      return res.status(403).json({ message: "Only provider can update" });

    if (Number(newAmount) < Number(connection.task.budget)) {
      return res.status(400).json({
        message: "Cannot reduce below original budget",
      });
    }

    connection.finalBudget = newAmount;

    await connection.save();

    res.json({
      message: "Budget updated",
      amount: newAmount
    });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};