const express = require("express");
const {
  getDashboardData,
  getAllUsers,
  getUserProfile,
} = require("../controllers/dashboardController");
const router = express.Router();
const authenticate = require("../middleware/authenticate"); // Middleware to verify JWT

router.get("/", authenticate, getDashboardData);
router.get("/users", authenticate, getAllUsers); // New route for fetching users
router.get("/profile", authenticate, getUserProfile);

module.exports = router;
