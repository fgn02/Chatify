// Initialize Lucide icons
lucide.createIcons();

const socket = io({
  transports: ["websocket"],
  cors: {
    credentials: true,
  },
});

// Get logged-in user's info from local storage
const user = JSON.parse(localStorage.getItem("user"));

// Add this near the top of the file, after the socket initialization
const token = localStorage.getItem("token");

if (!user) {
  alert("User not logged in. Redirecting to login page.");
  window.location.href = "index.html";
} else {
  // Register user with socket when connected
  socket.on("connect", () => {
    console.log("Connected to socket server");
    socket.emit("userConnected", user.id.toString());
  });
}

// Get URL parameters
function getUrlParameters() {
  const params = new URLSearchParams(window.location.search);
  return {
    userId: params.get("userId"),
    firstName: decodeURIComponent(params.get("firstName")),
    lastName: decodeURIComponent(params.get("lastName")),
  };
}

const chatPartner = getUrlParameters();

// Update the user profile section
async function updateUserProfile() {
  try {
    const response = await fetch("/dashboard/profile", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch user profile");
    }

    const data = await response.json();
    const profileNameElement = document.querySelector(".profile-name");
    if (profileNameElement) {
      profileNameElement.textContent = data.user.first_name;
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
  }
}

// Update the DOMContentLoaded event listener
document.addEventListener("DOMContentLoaded", () => {
  // Update chat partner name
  const userNameElement = document.querySelector(".username");
  if (userNameElement && chatPartner.firstName) {
    userNameElement.textContent = `${chatPartner.firstName} ${chatPartner.lastName}`;
  }

  // Update user profile
  updateUserProfile();

  // Initialize Lucide icons again after dynamic content
  lucide.createIcons();

  // Load previous messages
  loadPreviousMessages();
});

// Create message element
function createMessageElement(data, isSent) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message");
  if (isSent) messageDiv.classList.add("sent");

  const avatar = document.createElement("div");
  avatar.className =
    "w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden";

  // Use the picture_url from the message data instead of just the current user's
  const profilePicUrl = isSent ? user.picture_url : data.picture_url;

  if (profilePicUrl) {
    // If there's a profile picture, show it
    avatar.innerHTML = `<img src="${profilePicUrl}" alt="Profile" class="w-full h-full object-cover">`;
  } else {
    // If no profile picture, show default icon
    avatar.innerHTML =
      '<i data-lucide="user" class="w-4 h-4 text-gray-600"></i>';
  }

  const content = document.createElement("div");
  content.className = "message-content";

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";

  if (data.image) {
    const img = document.createElement("img");
    img.src = data.image;
    bubble.appendChild(img);
  }

  if (data.message) {
    const messageText = document.createElement("div");
    messageText.textContent = data.message;
    bubble.appendChild(messageText);
  }

  const time = document.createElement("div");
  time.className = "message-time";
  time.textContent = new Date(data.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  content.appendChild(bubble);
  content.appendChild(time);
  messageDiv.appendChild(avatar);
  messageDiv.appendChild(content);

  lucide.createIcons();

  return messageDiv;
}

// Load previous messages
async function loadPreviousMessages() {
  try {
    const response = await fetch(`/messages?partnerId=${chatPartner.userId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const data = await response.json();
    const messagesContainer = document.getElementById("messages-container");

    data.messages.forEach((msg) => {
      const messageElement = createMessageElement(
        {
          message: msg.message,
          timestamp: msg.created_at,
          sender_id: msg.sender_id,
          picture_url: msg.picture_url,
        },
        msg.sender_id === user.id
      );

      messagesContainer.appendChild(messageElement);
    });

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  } catch (error) {
    console.error("Error loading messages:", error);
  }
}

// Send message handler
document.getElementById("sendButton").addEventListener("click", async () => {
  const messageInput = document.getElementById("messageInput");
  const message = messageInput.value.trim();

  if (message || selectedImage) {
    let messageData = {
      sender_id: parseInt(user.id),
      receiver_id: parseInt(chatPartner.userId),
      message: message,
      timestamp: new Date().toISOString(),
    };

    if (selectedImage) {
      // Convert image to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        messageData.image = e.target.result;

        console.log("Sending message with image:", messageData);
        socket.emit("sendMessage", messageData);

        // Add message to UI immediately for sender
        const messageElement = createMessageElement(messageData, true);
        document
          .getElementById("messages-container")
          .appendChild(messageElement);

        // Clear input and image
        messageInput.value = "";
        selectedImage = null;
        imagePreviewContainer.classList.add("hidden");

        // Scroll to bottom
        const messagesContainer = document.getElementById("messages-container");
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      };
      reader.readAsDataURL(selectedImage);
    } else {
      console.log("Sending message:", messageData);
      socket.emit("sendMessage", messageData);

      // Add message to UI immediately for sender
      const messageElement = createMessageElement(messageData, true);
      document.getElementById("messages-container").appendChild(messageElement);
      messageInput.value = "";

      // Scroll to bottom
      const messagesContainer = document.getElementById("messages-container");
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }
});

// Enter key handler
document.getElementById("messageInput").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    document.getElementById("sendButton").click();
  }
});

// Receive message handler - make sure this is outside any other function
socket.on("receiveMessage", (data) => {
  console.log("Received message:", data);
  // Convert IDs to strings for comparison
  if (data.sender_id.toString() === chatPartner.userId.toString()) {
    const messageElement = createMessageElement(
      {
        ...data,
        picture_url: data.picture_url,
      },
      false
    );
    document.getElementById("messages-container").appendChild(messageElement);

    // Scroll to bottom
    const messagesContainer = document.getElementById("messages-container");
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
});

// Socket error handlers
socket.on("connect_error", (error) => {
  console.error("Connection Error:", error);
});

socket.on("error", (error) => {
  console.error("Socket Error:", error);
});

socket.on("disconnect", () => {
  console.log("Disconnected from socket server");
});

// Add these after your existing socket initialization

let selectedImage = null;

// Emoji picker functionality
const emojiButton = document.getElementById("emojiButton");
const emojiPicker = document.getElementById("emojiPicker");
const messageInput = document.getElementById("messageInput");

emojiButton.addEventListener("click", () => {
  emojiPicker.classList.toggle("active");
});

document
  .querySelector("emoji-picker")
  .addEventListener("emoji-click", (event) => {
    messageInput.value += event.detail.unicode;
    emojiPicker.classList.remove("active");
    messageInput.focus();
  });

// Close emoji picker when clicking outside
document.addEventListener("click", (e) => {
  if (!emojiButton.contains(e.target) && !emojiPicker.contains(e.target)) {
    emojiPicker.classList.remove("active");
  }
});

// Image upload functionality
const plusButton = document.getElementById("plusButton");
const uploadOptions = document.getElementById("uploadOptions");
const imageInput = document.getElementById("imageInput");
const imageUploadOption = document.getElementById("imageUploadOption");
const imagePreviewContainer = document.getElementById("imagePreviewContainer");
const imagePreview = document.getElementById("imagePreview");
const removeImage = document.getElementById("removeImage");

plusButton.addEventListener("click", () => {
  uploadOptions.classList.toggle("active");
});

imageUploadOption.addEventListener("click", () => {
  imageInput.click();
  uploadOptions.classList.remove("active");
});

imageInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    selectedImage = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview.src = e.target.result;
      imagePreviewContainer.classList.remove("hidden");
    };
    reader.readAsDataURL(file);
  }
});

removeImage.addEventListener("click", () => {
  selectedImage = null;
  imageInput.value = "";
  imagePreviewContainer.classList.add("hidden");
});

// Close upload options when clicking outside
document.addEventListener("click", (e) => {
  if (!plusButton.contains(e.target) && !uploadOptions.contains(e.target)) {
    uploadOptions.classList.remove("active");
  }
});

// Mobile menu handling
const menuButton = document.getElementById("menuButton");
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");

function toggleSidebar() {
  sidebar.classList.toggle("active");
  sidebarOverlay.style.display = sidebar.classList.contains("active")
    ? "block"
    : "none";
}

menuButton.addEventListener("click", toggleSidebar);
sidebarOverlay.addEventListener("click", toggleSidebar);

// Close sidebar when window is resized to desktop size
window.addEventListener("resize", () => {
  if (window.innerWidth >= 1024) {
    sidebar.classList.remove("active");
    sidebarOverlay.style.display = "none";
  }
});

// Close sidebar when clicking a link or button inside it
sidebar.addEventListener("click", (e) => {
  if (e.target.tagName === "A" || e.target.tagName === "BUTTON") {
    if (window.innerWidth < 1024) {
      toggleSidebar();
    }
  }
});
