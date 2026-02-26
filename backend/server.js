const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");

const app = express();
const adminRoutes = require("./routes/adminRoutes");
const userRoutes = require("./routes/userRoutes");
const workerRoutes = require("./routes/workerRoutes");
const taskRoutes = require("./routes/taskRoutes");
const connectionRoutes = require("./routes/connectionRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const messageRoutes = require("./routes/messageRoutes");
const Message = require("./models/Message");
const Connection = require("./models/Connection");

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",               // local frontend
      "https://microtask-platform-1-5hd7.onrender.com"   // deployed frontend
    ],
    credentials: true,
  })
);

app.use(express.json());


app.use("/uploads", express.static("uploads"));


// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/stats", require("./routes/statsRoutes"));
app.use("/api/protected", require("./routes/protectedRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/payment", require("./routes/paymentRoutes"));
app.use("/api/users", userRoutes);
app.use("/api/workers", workerRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/api/connections", connectionRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/messages", messageRoutes);
// 🔥 Connect DB FIRST
connectDB();

// Test route
app.get("/", (req, res) => {
  res.send("Backend running");
});

const PORT = process.env.PORT || 5000;
const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);

const io = new Server(server, {
  
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});
app.set("io", io);

const jwt = require("jsonwebtoken");

io.on("connection", (socket) => {

  socket.on("join_user", (userId) => {
  socket.join(userId);
});

  socket.on("join_room", (connectionId) => {
    socket.join(connectionId);
  });

  socket.on("send_message", async (data) => {
    try {

      // 🔐 Extract token from data
      const decoded = jwt.verify(data.token, process.env.JWT_SECRET);

      const connection = await Connection.findById(data.connectionId)
        .populate("task");

      if (!connection) return;

      if (!["accepted", "provider_confirmed", "confirmed"].includes(connection.status)) return;

      if (connection.task?.status === "completed") return;

      const newMessage = await Message.create({
        connection: data.connectionId,
        sender: decoded.userId,  // 🔥 secure sender
        type: data.type,
        message: data.message,
        imageUrl: data.imageUrl,
        voiceUrl: data.voiceUrl,
        budgetAmount: data.budgetAmount,
      });

      // 🔥 Determine receiver from already fetched connection

const receiverId =
  connection.provider.toString() === decoded.userId
    ? connection.worker.toString()
    : connection.provider.toString();

io.to(receiverId).emit("new_unread");

      const populatedMessage = await Message.findById(newMessage._id)
         .populate("sender", "_id name");

      io.to(data.connectionId).emit("receive_message", populatedMessage);
       
      

    } catch (err) {
      console.log("Socket error:", err);
    }
  });

  // 🟢 IMAGE & VOICE BROADCAST
  socket.on("broadcast_message", (data) => {
    io.to(data.connectionId).emit("receive_message", data.message);
  });

});



server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

