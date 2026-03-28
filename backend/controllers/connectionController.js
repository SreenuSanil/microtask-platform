const Connection = require("../models/Connection");
const Task = require("../models/Task");
const Notification = require("../models/Notification");
const Message = require("../models/Message");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");
/* =========================
   SEND CONNECTION REQUEST
========================= */
exports.sendConnectionRequest = async (req, res) => {
  try {
    const { taskId, workerId } = req.body;

        if (!taskId || !workerId) {
      return res.status(400).json({
        message: "Missing taskId or workerId"
      });
    }

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
   
// 🔥 SAFE EMAIL BLOCK (NO CRASH)

const worker = await User.findById(workerId);
const provider = await User.findById(req.user.userId);

if (!worker || !provider) {
  console.log("Worker or Provider not found", { workerId, providerId: req.user.userId });

  return res.status(400).json({
    message: "Invalid worker or provider"
  });
}

try {
  const { connectionRequestTemplate } = require("../utils/emailTemplates");

  const { subject, html } = connectionRequestTemplate(
    worker.name,
    provider.name
  );

 await sendEmail({
  to: worker.email,
  subject,
  html,
});

} catch (err) {
  console.log("Email failed:", err.message);
}
res.json(connection);

  } catch (err) {
    console.error(err);
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

  
    connection.status = "accepted";
    connection.chatEnabled = true;

    await connection.save();

    const removedConnections = await Connection.find({
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

const worker = await User.findById(req.user.userId);

await Notification.create({
  userId: connection.provider,
  title: "Invitation Accepted",
  message: `${worker?.name || "A worker"} accepted your task "${connection.task.title}"`,
  type: "connection_accepted",
  connectionId: connection._id,
  taskId: connection.task._id,
  profileImage: worker.profileImage
});

try {
  const { connectionAcceptedTemplate } = require("../utils/emailTemplates");

  const provider = await User.findById(connection.provider);

  if (provider) {
    const { subject, html } = connectionAcceptedTemplate(
      provider.name,
      connection.task.title
    );

    await sendEmail({
      to: provider.email,
      subject,
      html,
    });
  }

} catch (err) {
  console.log("Accept email failed:", err.message);
}

io.to(connection.provider.toString()).emit("new_notification");

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

    const connection = await Connection.findById(req.params.id)
       .populate("task");
    if (!connection)
      return res.status(404).json({ message: "Connection not found" });

    if (connection.worker.toString() !== req.user.userId.toString())
      return res.status(403).json({ message: "Not authorized" });

    if (connection.status !== "pending")
      return res.status(400).json({ message: "Invalid status" });

    connection.status = "rejected";

    await connection.save();
const worker = await User.findById(req.user.userId);

        await Notification.create({
      userId: connection.provider,
      title: "Invitation Rejected",
       message: `${worker?.name || "A worker"} rejected your task "${connection.task.title}"`,
      type: "connection_rejected",
       taskId: connection.task,
      profileImage: worker.profileImage
    });
   const io = req.app.get("io");
io.to(connection.provider.toString()).emit("new_notification");
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
    connection.chatEnabled = false;

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
      status: { $in: ["pending", "accepted"] },
      chatEnabled: true
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

// 🔥 CHECK IF WORKER BUSY ON SAME DATE
let isWorkerBusy = false;

if (chat.worker && chat.task?.taskDate) {
  const sameDate = new Date(chat.task.taskDate).toDateString();

  const activeTask = await Task.findOne({
    assignedWorker: chat.worker._id,
    status: "in_progress",
  });

  if (activeTask) {
    const activeDate = new Date(activeTask.taskDate).toDateString();

    if (activeDate === sameDate) {
      isWorkerBusy = true;
    }
  }
}

return {
  ...chat.toObject(),
  unreadCount: unread,
  taskStatus: chat.task?.status,
  paymentStatus: chat.task?.paymentStatus,
  isWorkerBusy, // 🔥 ADD THIS
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

   
    const io = req.app.get("io");

    const provider = await User.findById(connection.provider);

    await Notification.create({
      userId: connection.worker,
      title: "Job Confirmed",
      message: `${provider.name} confirmed job "${connection.task.title}" for ₹${connection.finalBudget}`,
      taskId: connection.task._id,
      connectionId: connection._id,
       profileImage: provider.profileImage, 
    });

    io.to(connection.worker.toString()).emit("new_notification");

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

    //  SET THIS CONNECTION CONFIRMED
    connection.status = "confirmed";
    await connection.save();

    const task = await Task.findById(connection.task);

    //  ASSIGN THIS WORKER
    task.status = "assigned";
    task.assignedWorker = connection.worker;

    await task.save();


const otherConnections = await Connection.find({
  task: connection.task,
  _id: { $ne: connection._id },
});


for (const conn of otherConnections) {
  await Notification.create({
    userId: conn.worker,
    title: "Task Closed",
    message: "Another worker has been selected for this task.",
    taskId: connection.task,
  });

  const io = req.app.get("io");
  io.to(conn.worker.toString()).emit("new_notification");
}

    // 🔔 NOTIFICATION
    const worker = await User.findById(connection.worker);

    await Notification.create({
      userId: connection.provider,
      title: "Worker Ready for Payment",
      message: `${worker.name} accepted the job. Please pay escrow to start work.`,
      connectionId: connection._id,
      taskId: connection.task,
      profileImage: worker.profileImage,
    });

    const io = req.app.get("io");
    io.to(connection.provider.toString()).emit("new_notification");

    res.json({ message: "Worker locked successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   UPDATE BUDGET
========================= */
exports.updateBudget = async (req, res) => {
  try {
    const { newAmount, newDate } = req.body;

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

    if (newDate) {
  connection.task.taskDate = newDate; 
  await connection.task.save();
}

await connection.save();

// 🔥 CHECK WORKER BUSY
let isWorkerBusy = false;

if (connection.worker && connection.task?.taskDate) {
  const sameDate = new Date(connection.task.taskDate).toDateString();

  const tasks = await Task.find({
    assignedWorker: connection.worker,
    status: { $in: ["assigned", "in_progress", "pending_verification"] }
  });

  for (let t of tasks) {
    if (!t.taskDate) continue;

    const d = new Date(t.taskDate).toDateString();

    if (d === sameDate) {
      isWorkerBusy = true;
      break;
    }
  }
}


res.json({
  message: "Budget & date updated",
  amount: connection.finalBudget,
  taskDate: connection.task.taskDate,
  isWorkerBusy
});

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};