// dashboardController.js
const db = require("../db");

const getDashboardData = (req, res) => {
  const userId = req.user.id;

  const sql = `
    WITH RankedMessages AS (
      SELECT 
        c.id AS conversation_id,
        c.name AS conversation_name,
        m.message,
        m.created_at,
        m.sender_id,
        sender.first_name AS sender_first_name,
        sender.last_name AS sender_last_name,
        sender.picture_url AS sender_picture_url,
        receiver.id AS receiver_id,
        receiver.first_name AS receiver_first_name,
        receiver.last_name AS receiver_last_name,
        receiver.picture_url AS receiver_picture_url,
        c.is_group,
        m.is_group_message,
        ROW_NUMBER() OVER (PARTITION BY c.id ORDER BY m.created_at DESC) as rn
      FROM conversations c
      JOIN group_members gm ON c.id = gm.conversation_id
      JOIN messages m ON c.id = m.conversation_id
      JOIN users sender ON m.sender_id = sender.id
      JOIN group_members gm2 ON c.id = gm2.conversation_id
      JOIN users receiver ON gm2.user_id = receiver.id
      WHERE gm.user_id = ? 
      AND gm2.user_id != ?
      AND c.is_group = FALSE
      AND m.is_group_message = FALSE
    )
    SELECT * FROM RankedMessages
    WHERE rn = 1
    ORDER BY created_at DESC
    LIMIT 10;
  `;

  db.query(sql, [userId, userId], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    // If no chats found, return empty array
    if (results.length === 0) {
      return res.status(200).json({ recentChats: [] });
    }

    // Transform results to include proper sender and receiver information
    const transformedResults = results.map((chat) => ({
      ...chat,
      sender: {
        id: chat.sender_id,
        name: `${chat.sender_first_name} ${chat.sender_last_name}`,
        picture_url: chat.sender_picture_url,
      },
      receiver: {
        id: chat.receiver_id,
        name: `${chat.receiver_first_name} ${chat.receiver_last_name}`,
        picture_url: chat.receiver_picture_url,
      },
    }));

    res.status(200).json({ recentChats: transformedResults });
  });
};

const getAllUsers = (req, res) => {
  const loggedInUserId = req.user.id;

  const sql = `
    SELECT id, first_name, last_name, email 
    FROM users 
    WHERE id != ?
    ORDER BY first_name ASC
  `;

  db.query(sql, [loggedInUserId], (error, results) => {
    if (error) {
      console.error("Database error:", error);
      return res.status(500).json({ error: "Database error" });
    }
    res.status(200).json({ users: results });
  });
};

const getUserProfile = (req, res) => {
  const userId = req.user.id;

  const sql = `
    SELECT id, first_name, last_name, email
    FROM users 
    WHERE id = ?
  `;

  db.query(sql, [userId], (error, results) => {
    if (error) {
      console.error("Database error:", error);
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ user: results[0] });
  });
};

module.exports = { getDashboardData, getAllUsers, getUserProfile };
