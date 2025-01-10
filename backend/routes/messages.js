const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authenticate");
const db = require("../db");

router.get("/", authenticate, async (req, res) => {
  const userId = req.user.id;
  const partnerId = req.query.partnerId;

  const sql = `
    SELECT m.*, u.picture_url, u.first_name, u.last_name
    FROM messages m
    JOIN conversations c ON m.conversation_id = c.id
    JOIN group_members gm1 ON c.id = gm1.conversation_id
    JOIN group_members gm2 ON c.id = gm2.conversation_id
    JOIN users u ON m.sender_id = u.id
    WHERE gm1.user_id = ? 
    AND gm2.user_id = ?
    AND m.is_group_message = FALSE
    AND c.is_group = FALSE
    ORDER BY m.created_at ASC
  `;

  db.query(sql, [userId, partnerId], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ messages: results });
  });
});

router.delete("/clear-all", authenticate, async (req, res) => {
  const userId = req.user.id;

  // Start a transaction to ensure data consistency
  db.beginTransaction(async (err) => {
    if (err) {
      console.error("Transaction error:", err);
      return res.status(500).json({ error: "Failed to start transaction" });
    }

    try {
      // First, get all conversation IDs for this user
      const [conversations] = await db.promise().query(
        `SELECT DISTINCT c.id 
         FROM conversations c
         JOIN group_members gm ON c.id = gm.conversation_id
         WHERE gm.user_id = ?`,
        [userId]
      );

      const conversationIds = conversations.map((c) => c.id);

      if (conversationIds.length > 0) {
        // Delete messages from these conversations
        await db
          .promise()
          .query("DELETE FROM messages WHERE conversation_id IN (?)", [
            conversationIds,
          ]);

        // Delete group members entries
        await db
          .promise()
          .query("DELETE FROM group_members WHERE conversation_id IN (?)", [
            conversationIds,
          ]);

        // Delete the conversations
        await db
          .promise()
          .query("DELETE FROM conversations WHERE id IN (?)", [
            conversationIds,
          ]);
      }

      // Commit the transaction
      db.commit((err) => {
        if (err) {
          return db.rollback(() => {
            res.status(500).json({ error: "Failed to commit transaction" });
          });
        }
        res.json({ message: "All conversations cleared successfully" });
      });
    } catch (error) {
      return db.rollback(() => {
        console.error("Error clearing conversations:", error);
        res.status(500).json({ error: "Failed to clear conversations" });
      });
    }
  });
});

module.exports = router;
