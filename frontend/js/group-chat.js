// At the start of the file
function updateSidebarUserName() {
  const userData = JSON.parse(localStorage.getItem("user"));
  if (userData) {
    const userNameElement = document.querySelector(".user-name");
    if (userNameElement) {
      userNameElement.textContent =
        userData.display_name || userData.first_name;
    }
  }
}

// Initialize Lucide icons
lucide.createIcons();

const socket = io("https://chatify-production-7bae.up.railway.app", {
  transports: ["websocket"],
  cors: {
    origin: "https://chatify-beryl.vercel.app",
    credentials: true,
  },
});

const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user"));

if (!user) {
  window.location.href = "index.html";
}

// Get URL parameters
function getUrlParameters() {
  const params = new URLSearchParams(window.location.search);
  return {
    groupId: params.get("groupId"),
    groupName: decodeURIComponent(params.get("groupName")),
  };
}

const groupInfo = getUrlParameters();

// Update group name in UI
function updateGroupName() {
  const groupNameElement = document.querySelector("h2.font-medium");
  if (groupNameElement && groupInfo.groupName) {
    groupNameElement.textContent = groupInfo.groupName;
  }
}

async function updateUserProfile() {
  try {
    const response = await fetch(
      "https://chatify-production-7bae.up.railway.app/dashboard/profile",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch user profile");
    }

    const data = await response.json();
    const userNameElement = document.querySelector(".user-name");
    if (userNameElement) {
      userNameElement.textContent = data.user.first_name;
    }
  } catch (error) {
    console.error("Error updating user profile:", error);
  }
}

async function loadGroupMembers() {
  try {
    const response = await fetch(
      `https://chatify-production-7bae.up.railway.app/groups/${groupInfo.groupId}/members`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) throw new Error("Failed to fetch group members");

    const data = await response.json();
    const container = document.getElementById("members-container");

    // Update member count in the top navbar
    const memberCountElement = document.querySelector(".member-count");
    if (memberCountElement) {
      memberCountElement.textContent = `${data.members.length} members`;
    }

    // Clear existing members
    container.innerHTML = "";

    // Add each member
    data.members.forEach((member) => {
      const memberDiv = document.createElement("div");
      memberDiv.className =
        "flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg";
      memberDiv.innerHTML = `
        <div class="relative">
          <div class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <i data-lucide="user" class="w-4 h-4 text-gray-600"></i>
          </div>
          <div class="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
        </div>
        <div class="flex-1">
          <p class="text-sm font-medium">${member.first_name} ${member.last_name}</p>
          <p class="text-xs text-gray-500">Online</p>
        </div>
      `;
      container.appendChild(memberDiv);
    });

    lucide.createIcons();
  } catch (error) {
    console.error("Error loading group members:", error);
  }
}

function createMessageElement(data, isSent) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add(
    "flex",
    "gap-3",
    "mb-4",
    isSent ? "justify-end" : "justify-start"
  );

  const content = document.createElement("div");
  content.className = "max-w-[70%]";

  if (!isSent) {
    const senderName = document.createElement("div");
    senderName.className = "text-xs text-gray-500 mb-1";
    senderName.textContent = `${data.sender.first_name} ${data.sender.last_name}`;
    content.appendChild(senderName);
  }

  const bubble = document.createElement("div");
  bubble.className = `p-3 rounded-lg ${
    isSent ? "bg-indigo-500 text-white" : "bg-gray-100"
  }`;
  bubble.textContent = data.message;

  const time = document.createElement("div");
  time.className = "text-xs text-gray-500 mt-1";
  time.textContent = new Date(
    data.timestamp || data.created_at
  ).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  content.appendChild(bubble);
  content.appendChild(time);
  messageDiv.appendChild(content);

  return messageDiv;
}

async function loadGroupMessages() {
  try {
    const response = await fetch(
      `https://chatify-production-7bae.up.railway.app/groups/${groupInfo.groupId}/messages`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) throw new Error("Failed to fetch messages");

    const data = await response.json();
    const messagesContainer = document.getElementById("messages-container");
    messagesContainer.innerHTML = "";

    data.messages.forEach((msg) => {
      const messageElement = createMessageElement(
        {
          message: msg.message,
          timestamp: msg.created_at,
          sender: {
            first_name: msg.first_name,
            last_name: msg.last_name,
          },
        },
        msg.sender_id === user.id
      );
      messagesContainer.appendChild(messageElement);
    });

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  } catch (error) {
    console.error("Error loading messages:", error);
  }
}

// Register user with socket
socket.on("connect", () => {
  console.log("Connected to socket server");
  socket.emit("userConnected", user.id.toString());
});

// Send message handler
document.getElementById("sendButton").addEventListener("click", async () => {
  const messageInput = document.getElementById("messageInput");
  const message = messageInput.value.trim();

  if (message) {
    const messageData = {
      sender_id: parseInt(user.id),
      group_id: parseInt(groupInfo.groupId),
      message: message,
      sender: {
        first_name: user.first_name,
        last_name: user.last_name,
      },
      timestamp: new Date().toISOString(),
    };

    // Send message through socket
    socket.emit("sendGroupMessage", messageData);

    // Add message to UI immediately
    const messageElement = createMessageElement(messageData, true);
    document.getElementById("messages-container").appendChild(messageElement);
    messageInput.value = "";

    // Scroll to bottom
    const messagesContainer = document.getElementById("messages-container");
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
});

// Handle received group messages
socket.on("receiveGroupMessage", (data) => {
  console.log("Received group message:", data);
  if (data.group_id.toString() === groupInfo.groupId) {
    const messageElement = createMessageElement(
      data,
      data.sender_id === user.id
    );
    document.getElementById("messages-container").appendChild(messageElement);

    const messagesContainer = document.getElementById("messages-container");
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
});

// Enter key handler
document.getElementById("messageInput").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    document.getElementById("sendButton").click();
  }
});

// Initialize chat
document.addEventListener("DOMContentLoaded", () => {
  updateSidebarUserName();
  updateUserProfile();
  updateGroupName();
  loadGroupMembers();
  loadGroupMessages();
});

document
  .querySelector(".text-xs.text-gray-500.cursor-pointer")
  .addEventListener("click", () => {
    window.location.href = "profile.html";
  });
