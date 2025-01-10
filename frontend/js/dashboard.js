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

const token = localStorage.getItem("token");

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch (e) {
    return null;
  }
}

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
    updateSidebarUserName();
  } catch (error) {
    console.error("Error fetching user profile:", error);
  }
}

function createChatItem(chat, currentUserId) {
  const displayName =
    chat.sender.id === currentUserId ? chat.receiver.name : chat.sender.name;
  const pictureUrl =
    chat.sender.id === currentUserId
      ? chat.receiver.picture_url
      : chat.sender.picture_url;
  const chatTime = new Date(chat.created_at).toLocaleTimeString();

  return `
    <div class="flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-gray-100 cursor-pointer chat-item" 
         data-chat-id="${chat.conversation_id}"
         data-user-id="${
           chat.sender.id === currentUserId ? chat.receiver.id : chat.sender.id
         }"
         data-user-name="${displayName}">
        <div class="relative">
            <div class="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                ${
                  pictureUrl
                    ? `<img src="${pictureUrl}" alt="Profile" class="w-full h-full object-cover">`
                    : `<i data-lucide="user" class="w-5 h-5 text-gray-600"></i>`
                }
            </div>
        </div>
        <div class="flex-1">
            <div class="flex items-center justify-between">
                <h3 class="font-medium">${displayName}</h3>
                <span class="text-xs text-gray-500">${chatTime}</span>
            </div>
            <p class="text-sm text-gray-500 truncate">${chat.message}</p>
        </div>
    </div>
  `;
}

function updateDashboard() {
  const currentUserId = parseInt(parseJwt(token).id);

  fetch("/dashboard", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }
      return response.json();
    })
    .then((data) => {
      const chatList = document.getElementById("chat-list");
      const uniqueChats = new Map();

      data.recentChats.forEach((chat) => {
        if (!uniqueChats.has(chat.conversation_id)) {
          uniqueChats.set(chat.conversation_id, chat);
        }
      });

      chatList.innerHTML = Array.from(uniqueChats.values())
        .map((chat) => createChatItem(chat, currentUserId))
        .join("");

      // Reinitialize Lucide icons for new chat items
      lucide.createIcons();

      // Add click handlers to chat items
      document.querySelectorAll(".chat-item").forEach((item) => {
        item.addEventListener("click", () => {
          const userId = item.dataset.userId;
          const userName = item.dataset.userName;
          const [firstName, lastName] = userName.split(" ");
          window.location.href = `chatscreen.html?userId=${userId}&firstName=${encodeURIComponent(
            firstName
          )}&lastName=${encodeURIComponent(lastName || "")}`;
        });
      });
    })
    .catch((error) => console.error("Error fetching dashboard data:", error));
}

// Search functionality
document.getElementById("searchInput").addEventListener("input", (e) => {
  const searchTerm = e.target.value.toLowerCase();
  const chatItems = document.querySelectorAll(".chat-item");

  chatItems.forEach((item) => {
    const name = item.querySelector("h3").textContent.toLowerCase();
    const message = item.querySelector("p").textContent.toLowerCase();

    if (name.includes(searchTerm) || message.includes(searchTerm)) {
      item.style.display = "flex";
    } else {
      item.style.display = "none";
    }
  });
});

// New Chat Overlay functionality
const newChatBtn = document.getElementById("newChatBtn");
const overlay = document.getElementById("newChatOverlay");
const closeOverlayBtn = document.getElementById("closeNewChatOverlay");

newChatBtn.addEventListener("click", async () => {
  const userList = document.getElementById("userList");
  overlay.classList.remove("hidden");

  try {
    const response = await fetch("/dashboard/users", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error("Failed to fetch users");

    const data = await response.json();
    userList.innerHTML = data.users
      .map(
        (user) => `
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span>${user.first_name} ${user.last_name}</span>
                <button 
                    class="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 start-chat-btn"
                    data-user-id="${user.id}"
                    data-first-name="${user.first_name}"
                    data-last-name="${user.last_name}"
                >
                    Chat
                </button>
            </div>
        `
      )
      .join("");

    // Add click handlers to chat buttons
    userList.querySelectorAll(".start-chat-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const userId = btn.dataset.userId;
        const firstName = btn.dataset.firstName;
        const lastName = btn.dataset.lastName;

        window.location.href = `chatscreen.html?userId=${userId}&firstName=${encodeURIComponent(
          firstName
        )}&lastName=${encodeURIComponent(lastName)}`;
      });
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    userList.innerHTML =
      '<div class="text-red-500 p-3">Failed to load users. Please try again.</div>';
  }
});

closeOverlayBtn.addEventListener("click", () => {
  overlay.classList.add("hidden");
});

overlay.addEventListener("click", (e) => {
  if (e.target === overlay) {
    overlay.classList.add("hidden");
  }
});

// Initialize dashboard
document.addEventListener("DOMContentLoaded", () => {
  updateUserProfile();
  updateDashboard();
});

// Set up periodic dashboard updates
setInterval(updateDashboard, 5000);

document
  .querySelector(".text-xs.text-gray-500.cursor-pointer")
  .addEventListener("click", () => {
    window.location.href = "profile.html";
  });

// Add this near your other event listeners
document.getElementById("clearChatsBtn").addEventListener("click", async () => {
  if (
    confirm(
      "Are you sure you want to clear all conversations? This cannot be undone."
    )
  ) {
    try {
      const response = await fetch("/messages/clear-all", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Clear the chat list UI
        document.getElementById("chat-list").innerHTML = "";
        alert("All conversations cleared successfully!");
      } else {
        throw new Error("Failed to clear conversations");
      }
    } catch (error) {
      console.error("Error clearing conversations:", error);
      alert("Failed to clear conversations. Please try again.");
    }
  }
});
