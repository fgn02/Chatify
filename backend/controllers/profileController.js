// backend/controllers/profileController.js
const db = require("../db");
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;

const getProfile = async (req, res) => {
  const userId = req.user.id;

  const sql = `
    SELECT id, first_name, last_name, email, display_name
    FROM users 
    WHERE id = ?
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Failed to fetch profile" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user: results[0] });
  });
};

const updateProfile = async (req, res) => {
  const userId = req.user.id;
  const { first_name, last_name, display_name } = req.body;

  console.log("Update request received:", {
    userId,
    first_name,
    last_name,
    display_name,
  }); // Debug log

  try {
    // Start a transaction
    await db.promise().beginTransaction();

    let updateFields = [];
    let updateValues = [];

    // Build dynamic update query
    if (first_name && last_name) {
      updateFields.push("first_name = ?", "last_name = ?");
      updateValues.push(first_name, last_name);
    }
    if (display_name) {
      updateFields.push("display_name = ?");
      updateValues.push(display_name);
    }

    if (updateFields.length > 0) {
      const updateSql = `
        UPDATE users 
        SET ${updateFields.join(", ")}
        WHERE id = ?
      `;
      updateValues.push(userId);

      console.log("Executing SQL:", updateSql, "with values:", updateValues); // Debug log

      await db.promise().query(updateSql, updateValues);
    }

    // Commit the transaction
    await db.promise().commit();

    // Fetch updated user data
    const [users] = await db
      .promise()
      .query(
        "SELECT first_name, last_name, display_name, email FROM users WHERE id = ?",
        [userId]
      );

    if (users.length === 0) {
      throw new Error("User not found");
    }

    console.log("Update successful, returning:", users[0]); // Debug log

    res.json({
      message: "Profile updated successfully",
      user: users[0],
    });
  } catch (error) {
    await db.promise().rollback();
    console.error("Update profile error:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to update profile" });
  }
};

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/profiles/"); // Make sure this directory exists
  },
  filename: function (req, file, cb) {
    cb(null, "profile-" + req.user.id + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
  },
}).single("profile_picture");

const uploadProfilePicture = async (req, res) => {
  try {
    upload(req, res, async function (err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const userId = req.user.id;
      const fileName = req.file.filename;
      const fileUrl = `/uploads/profiles/${fileName}`;

      // Update database with new picture URL
      const updateSql = "UPDATE users SET picture_url = ? WHERE id = ?";
      await db.promise().query(updateSql, [fileUrl, userId]);

      // Return the updated URL
      res.json({
        message: "Profile picture updated successfully",
        picture_url: fileUrl,
      });
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to upload profile picture" });
  }
};

// Add this function to handle profile picture removal
const removeProfilePicture = async (req, res) => {
  const userId = req.user.id;

  try {
    // Get current picture URL
    const [users] = await db
      .promise()
      .query("SELECT picture_url FROM users WHERE id = ?", [userId]);

    if (users[0]?.picture_url) {
      // Delete file from filesystem
      const filePath = path.join(__dirname, "..", users[0].picture_url);
      try {
        await fs.unlink(filePath);
      } catch (err) {
        console.error("Error deleting file:", err);
      }
    }

    // Update database to remove picture URL
    await db
      .promise()
      .query("UPDATE users SET picture_url = NULL WHERE id = ?", [userId]);

    res.json({
      message: "Profile picture removed successfully",
      success: true,
    });
  } catch (error) {
    console.error("Remove picture error:", error);
    res.status(500).json({ error: "Failed to remove profile picture" });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadProfilePicture,
  removeProfilePicture,
};
