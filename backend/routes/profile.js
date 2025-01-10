// backend/routes/profile.js
const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authenticate");
const {
  getProfile,
  updateProfile,
  uploadProfilePicture,
  removeProfilePicture,
} = require("../controllers/profileController");
const db = require("../db");

// GET profile data
router.get("/", authenticate, getProfile);

// Update profile
router.put("/update", authenticate, async (req, res) => {
  const userId = req.user.id;
  const { display_name, first_name, last_name } = req.body;

  let updateFields = [];
  let queryParams = [];

  // Handle display name update
  if (display_name) {
    updateFields.push("display_name = ?");
    queryParams.push(display_name);
  }

  // Handle first name update
  if (first_name) {
    updateFields.push("first_name = ?");
    queryParams.push(first_name);
  }

  // Handle last name update
  if (last_name) {
    updateFields.push("last_name = ?");
    queryParams.push(last_name);
  }

  // Add userId to params
  queryParams.push(userId);

  // Only proceed if there are fields to update
  if (updateFields.length === 0) {
    return res.status(400).json({ error: "No fields to update" });
  }

  const sql = `
    UPDATE users 
    SET ${updateFields.join(", ")}
    WHERE id = ?
  `;

  db.query(sql, queryParams, (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Failed to update profile" });
    }

    // Fetch updated user data
    const fetchSql = `
      SELECT id, first_name, last_name, email, display_name
      FROM users 
      WHERE id = ?
    `;

    db.query(fetchSql, [userId], (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res
          .status(500)
          .json({ error: "Failed to fetch updated profile" });
      }

      res.json({
        success: true,
        message: "Profile updated successfully",
        user: results[0],
      });
    });
  });
});

// Add the upload route
router.post("/upload-picture", authenticate, uploadProfilePicture);

// Add the remove picture route
router.delete("/remove-picture", authenticate, removeProfilePicture);

module.exports = router;
