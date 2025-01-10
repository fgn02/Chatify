const socketIO = require("socket.io");
const db = require("./db");

function initializeSocket(server) {
  const io = socketIO(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5500",
      methods: ["GET", "POST"],
      credentials: true,
      allowedHeaders: ["my-custom-header"],
    },
    transports: ["websocket", "polling"],
  });

  // Store active users with their socket IDs
  const activeUsers = new Map();

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Handle user joining
    socket.on("userConnected", (userId) => {
      // Convert userId to string to ensure consistent comparison
      const userIdStr = userId.toString();
      console.log("User registered:", userIdStr, "Socket:", socket.id);
      activeUsers.set(userIdStr, socket.id);

      // Debug log current active users
      console.log("Active users:", Array.from(activeUsers.entries()));
    });

    // Handle sending messages
    socket.on("sendMessage", async (data) => {
      try {
        console.log("Processing message:", data);
        const { sender_id, receiver_id, message } = data;

        // Get sender's profile picture
        const [senderData] = await db
          .promise()
          .query("SELECT picture_url FROM users WHERE id = ?", [sender_id]);

        // Get or create personal conversation
        const conversationId = await getOrCreateConversation(
          sender_id,
          receiver_id
        );

        // Save message with is_group_message = FALSE
        const [messageResult] = await db.promise().query(
          `INSERT INTO messages (sender_id, conversation_id, message, created_at, is_group_message) 
           VALUES (?, ?, ?, NOW(), FALSE)`,
          [sender_id, conversationId, message]
        );

        // Prepare message data with picture_url
        const messageData = {
          message_id: messageResult.insertId,
          conversation_id: conversationId,
          sender_id,
          receiver_id,
          message,
          timestamp: new Date().toISOString(),
          picture_url: senderData[0]?.picture_url || null,
        };

        // Get receiver's socket ID
        const receiverSocketId = activeUsers.get(receiver_id.toString());

        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receiveMessage", messageData);
        }

        // Send confirmation to sender
        socket.emit("messageSent", messageData);
      } catch (error) {
        console.error("Error handling message:", error);
        socket.emit("messageError", { error: "Failed to send message" });
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      // Find and remove the disconnected user
      for (const [userId, socketId] of activeUsers.entries()) {
        if (socketId === socket.id) {
          activeUsers.delete(userId);
          console.log("User disconnected:", userId, "Socket:", socket.id);
          break;
        }
      }
      console.log("Updated active users:", Array.from(activeUsers.entries()));
    });

    // Handle group messages
    socket.on("sendGroupMessage", async (data) => {
      try {
        const { sender_id, group_id, message, sender } = data;

        // Save message to database
        const sql = `
          INSERT INTO messages (sender_id, conversation_id, message, created_at)
          VALUES (?, ?, ?, NOW())
        `;

        db.query(sql, [sender_id, group_id, message], (err, result) => {
          if (err) {
            console.error("Error saving group message:", err);
            return;
          }

          const messageData = {
            ...data,
            message_id: result.insertId,
          };

          // Get all group members
          const membersSql = `
            SELECT user_id 
            FROM group_members 
            WHERE conversation_id = ?
          `;

          db.query(membersSql, [group_id], (err, members) => {
            if (err) {
              console.error("Error getting group members:", err);
              return;
            }

            // Emit message to all online group members
            members.forEach((member) => {
              const memberSocketId = activeUsers.get(member.user_id.toString());
              if (memberSocketId && memberSocketId !== socket.id) {
                io.to(memberSocketId).emit("receiveGroupMessage", messageData);
              }
            });
          });
        });
      } catch (error) {
        console.error("Error handling group message:", error);
      }
    });
  });

  return io;
}

// Helper function to get or create conversation
async function getOrCreateConversation(user1Id, user2Id) {
  try {
    // First try to find an existing personal conversation between these users
    const [existingConv] = await db.promise().query(
      `SELECT c.id 
       FROM conversations c
       JOIN group_members gm1 ON c.id = gm1.conversation_id
       JOIN group_members gm2 ON c.id = gm2.conversation_id
       WHERE gm1.user_id = ? 
       AND gm2.user_id = ?
       AND c.is_group = FALSE
       LIMIT 1`,
      [user1Id, user2Id]
    );

    if (existingConv.length > 0) {
      return existingConv[0].id;
    }

    // If no existing conversation, create a new one
    return new Promise((resolve, reject) => {
      db.beginTransaction(async (err) => {
        if (err) return reject(err);

        try {
          // Create new conversation with is_group = FALSE
          const [result] = await db
            .promise()
            .query(
              "INSERT INTO conversations (name, is_group) VALUES (?, FALSE)",
              [`chat_${user1Id}_${user2Id}`]
            );

          const conversationId = result.insertId;

          // Add both users to the conversation
          await db
            .promise()
            .query(
              "INSERT INTO group_members (conversation_id, user_id) VALUES (?, ?), (?, ?)",
              [conversationId, user1Id, conversationId, user2Id]
            );

          await db.promise().commit();
          resolve(conversationId);
        } catch (error) {
          await db.promise().rollback();
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error("Error in getOrCreateConversation:", error);
    throw error;
  }
}

// Helper function to save message
function saveMessage(senderId, conversationId, message) {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO messages (sender_id, conversation_id, message, created_at) 
      VALUES (?, ?, ?, NOW())
    `;

    db.query(sql, [senderId, conversationId, message], (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

// Helper function to get user details
function getUserDetails(userId) {
  return new Promise((resolve, reject) => {
    const sql = "SELECT id, first_name, last_name FROM users WHERE id = ?";
    db.query(sql, [userId], (err, results) => {
      if (err) reject(err);
      else resolve(results[0] || null);
    });
  });
}

// Helper function to get user's conversations
function getUserConversations(userId) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT DISTINCT c.id
      FROM conversations c
      JOIN group_members gm ON c.id = gm.conversation_id
      WHERE gm.user_id = ?
    `;

    db.query(sql, [userId], (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
}

module.exports = initializeSocket;
