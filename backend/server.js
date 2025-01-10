const express = require("express");
const http = require("http");
const bodyParser = require("body-parser");
const cors = require("cors");
const db = require("./db");
const initializeSocket = require("./socket");
const path = require("path");
const fs = require("fs");

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Global error handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Middleware
app.use(bodyParser.json());
app.use(
  cors({
    origin: "http://127.0.0.1:5500",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "my-custom-header"],
  })
);

// Add this after your middleware setup
app.use("/uploads", express.static("uploads"));

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, "uploads/profiles");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Routes
const authRoutes = require("./routes/auth");
const dashboardRoutes = require("./routes/dashboard");
const messagesRoutes = require("./routes/messages");
const groupRoutes = require("./routes/groups");
const profileRoutes = require("./routes/profile");

app.use("/auth", authRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/messages", messagesRoutes);
app.use("/groups", groupRoutes);
app.use("/profile", profileRoutes);

// Initialize Socket.IO
const io = initializeSocket(server);

// Handle process errors
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});

// Start the server
const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = { app, server };
