const express = require("express");
const http = require("http");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const db = require("./db");
const initializeSocket = require("./socket");

const app = express();
const server = http.createServer(app);

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, "../frontend")));

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API routes
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

// Serve index.html for all other routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// Initialize Socket.IO
const io = initializeSocket(server);

// Error handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server };
