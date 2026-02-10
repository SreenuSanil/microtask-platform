const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");

const app = express();
const adminRoutes = require("./routes/adminRoutes");
// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",               // local frontend
      "https://your-frontend.onrender.com"   // deployed frontend
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
app.use("/api/worker", require("./routes/workerRoutes"));
app.use("/api/payment", require("./routes/paymentRoutes"));

// 🔥 Connect DB FIRST
connectDB();

// Test route
app.get("/", (req, res) => {
  res.send("Backend running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
