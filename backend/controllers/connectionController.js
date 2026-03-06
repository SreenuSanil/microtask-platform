const Connection = require("../models/Connection");
const Task = require("../models/Task");
const Notification = require("../models/Notification");
const Message = require("../models/Message");

// ============================
// SEND CONNECTION REQUEST
// ============================
const sendConnectionRequest = async (req, res) => {
  try {
    const { taskId, workerId } = req.body;

    const existing = await Connection.findOne({
      task: taskId,
      worker: workerId,
      provider: req.user.userId,
    });

    if (existing) {
      return res.status(400).json({ message: "Already requested" });
    }

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

// ============================
// CHECK EXISTING CONNECTION
// ============================
const checkConnection = async (req, res) => {
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




// ============================
// ACCEPT CONNECTION
// ============================
const acceptConnection = async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.id)
      .populate("task");

    if (!connection) {
      return res.status(404).json({ message: "Connection not found" });
    }

    if (connection.status !== "pending") {
      return res.status(400).json({ message: "Invalid status" });
    }

    const task = await Task.findById(connection.task._id);

    if (task.status !== "open") {
      return res.status(400).json({
        message: "Task already assigned",
      });
    }

    // ✅ MOVE YOUR SAME-DATE CHECK HERE
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

    // 🔒 CHECK IF WORKER HAS ACTIVE TASK
    const activeTask = await Task.findOne({
      assignedWorker: req.user.userId,
      status: { $in: ["assigned", "in_progress"] },
    });

    if (activeTask) {
      return res.status(400).json({
        message:
          "You must complete your current task before accepting another.",
      });
    }

    connection.status = "accepted";
     connection.chatEnabled = true;
    await connection.save();
    await Notification.create({
      userId: connection.provider,
      title: "Invitation Accepted",
      message: "A worker accepted your invitation.",
    });

    res.json({ message: "Negotiation started" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};



const rejectConnection = async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.id);

    if (!connection) {
      return res.status(404).json({ message: "Connection not found" });
    }

    if (connection.worker.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    connection.status = "rejected";
    await connection.save();

    res.json({ message: "Invitation rejected" });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
const closeConnection = async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.id);

    if (!connection) {
      return res.status(404).json({ message: "Connection not found" });
    }

    connection.status = "closed";
    await connection.save();

    res.json({ message: "Negotiation closed" });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
const getWorkerInvitations = async (req, res) => {
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
const getMyChats = async (req, res) => {
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

    return res.json(chatsWithUnread);

  } catch (err) {
    console.error("getMyChats error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


const getProviderInvites = async (req, res) => {
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
  

module.exports = {
  sendConnectionRequest,
  checkConnection,
  acceptConnection,
  rejectConnection,
  closeConnection,
  getWorkerInvitations,
  getMyChats,
  getProviderInvites,

};

