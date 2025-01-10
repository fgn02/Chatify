const db = require("../db");

const getGroupDashboard = (req, res) => {
  const userId = req.user.id;

  const sql = `
    SELECT 
      c.id,
      c.name,
      m.message as last_message,
      m.created_at as last_message_time,
      (
        SELECT COUNT(DISTINCT user_id) 
        FROM group_members 
        WHERE conversation_id = c.id
      ) as member_count
    FROM conversations c
    JOIN group_members gm ON c.id = gm.conversation_id
    LEFT JOIN messages m ON m.id = (
      SELECT id 
      FROM messages 
      WHERE conversation_id = c.id 
      ORDER BY created_at DESC 
      LIMIT 1
    )
    WHERE c.is_group = 1 
    AND EXISTS (
      SELECT 1 
      FROM group_members 
      WHERE conversation_id = c.id 
      AND user_id = ?
    )
    GROUP BY c.id, c.name, m.message, m.created_at
    ORDER BY 
      CASE WHEN m.created_at IS NULL THEN 1 ELSE 0 END,
      m.created_at DESC;
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    res.status(200).json({ groups: results });
  });
};

const createGroup = (req, res) => {
  const { name, members } = req.body;
  const creatorId = req.user.id;

  if (!name || !members || !Array.isArray(members) || members.length === 0) {
    return res.status(400).json({ error: "Invalid group data" });
  }

  // Start transaction
  db.beginTransaction((err) => {
    if (err) {
      console.error("Transaction error:", err);
      return res.status(500).json({ error: "Transaction error" });
    }

    // Create conversation (group)
    const createGroupSql = `
        INSERT INTO conversations (name, is_group, created_at)
        VALUES (?, 1, NOW())
    `;

    db.query(createGroupSql, [name], (err, result) => {
      if (err) {
        console.error("Create group error:", err);
        return db.rollback(() => {
          res.status(500).json({ error: "Failed to create group" });
        });
      }

      const groupId = result.insertId;
      const allMembers = [...new Set([...members, creatorId])]; // Remove duplicates
      const memberValues = allMembers.map((memberId) => [groupId, memberId]);

      // Add members to group
      const addMembersSql = `
        INSERT INTO group_members (conversation_id, user_id)
        VALUES ?
      `;

      db.query(addMembersSql, [memberValues], (err) => {
        if (err) {
          console.error("Add members error:", err);
          return db.rollback(() => {
            res.status(500).json({ error: "Failed to add members" });
          });
        }

        // Commit transaction
        db.commit((err) => {
          if (err) {
            console.error("Commit error:", err);
            return db.rollback(() => {
              res.status(500).json({ error: "Failed to commit transaction" });
            });
          }

          res.status(201).json({
            message: "Group created successfully",
            groupId: groupId,
            name: name,
          });
        });
      });
    });
  });
};

const getGroupMembers = (req, res) => {
  const groupId = req.params.groupId;

  const sql = `
        SELECT u.id, u.first_name, u.last_name
        FROM users u
        JOIN group_members gm ON u.id = gm.user_id
        WHERE gm.conversation_id = ?
    `;

  db.query(sql, [groupId], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ members: results });
  });
};

const getGroupMessages = (req, res) => {
  const groupId = req.params.groupId;

  const sql = `
        SELECT m.*, u.first_name, u.last_name
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.conversation_id = ?
        ORDER BY m.created_at ASC
    `;

  db.query(sql, [groupId], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ messages: results });
  });
};

const sendGroupMessage = async (req, res) => {
  const { groupId, message } = req.body;
  const senderId = req.user.id;

  const sql = `
    INSERT INTO messages (conversation_id, sender_id, message, is_group_message)
    VALUES (?, ?, ?, TRUE)
  `;

  db.query(sql, [groupId, senderId, message], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ success: true, messageId: result.insertId });
  });
};

module.exports = {
  getGroupDashboard,
  createGroup,
  getGroupMembers,
  getGroupMessages,
  sendGroupMessage,
};
