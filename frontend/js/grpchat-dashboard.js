// At the start of the file
function updateSidebarUserName() {
  const userData = JSON.parse(localStorage.getItem("user"));
  if (userData) {
    const userNameElement = document.querySelector(".user-name");
    if (userNameElement) {
      userNameElement.textContent = userData.display_name;
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
    console.error("Error fetching user profile:", error);
  }
}

function createGroupItem(group) {
  const groupTime = group.last_message_time
    ? new Date(group.last_message_time).toLocaleTimeString()
    : "No messages yet";

  return `
        <div class="flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-gray-100 cursor-pointer group-item" 
             data-group-id="${group.id}"
             data-group-name="${group.name}">
            <div class="relative">
                <div class="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <i data-lucide="users" class="w-5 h-5 text-indigo-600"></i>
                </div>
            </div>
            <div class="flex-1">
                <div class="flex items-center justify-between">
                    <h3 class="font-medium">${group.name}</h3>
                    <span class="text-xs text-gray-500">${groupTime}</span>
                </div>
                <div class="flex justify-between">
                    <p class="text-sm text-gray-500 truncate">${
                      group.last_message || "No messages yet"
                    }</p>
                    <span class="text-xs text-gray-500">${
                      group.member_count
                    } members</span>
                </div>
            </div>
        </div>
    `;
}

function updateDashboard() {
  fetch("https://chatify-production-7bae.up.railway.app/groups/dashboard", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch group data");
      }
      return response.json();
    })
    .then((data) => {
      const groupList = document.getElementById("group-list");
      groupList.innerHTML = data.groups
        .map((group) => createGroupItem(group))
        .join("");

      // Reinitialize Lucide icons for new items
      lucide.createIcons();

      // Add click handlers to group items
      document.querySelectorAll(".group-item").forEach((item) => {
        item.addEventListener("click", () => {
          const groupId = item.dataset.groupId;
          const groupName = item.dataset.groupName;
          window.location.href = `group-chat.html?groupId=${groupId}&groupName=${encodeURIComponent(
            groupName
          )}`;
        });
      });
    })
    .catch((error) => console.error("Error fetching group data:", error));
}

// Search functionality
document.getElementById("searchInput").addEventListener("input", (e) => {
  const searchTerm = e.target.value.toLowerCase();
  const groupItems = document.querySelectorAll(".group-item");

  groupItems.forEach((item) => {
    const name = item.querySelector("h3").textContent.toLowerCase();
    const message = item.querySelector("p").textContent.toLowerCase();

    if (name.includes(searchTerm) || message.includes(searchTerm)) {
      item.style.display = "flex";
    } else {
      item.style.display = "none";
    }
  });
});

// Create Group Overlay functionality
const createGroupBtn = document.getElementById("createGroupBtn");
const overlay = document.getElementById("createGroupOverlay");
const closeOverlayBtn = document.getElementById("closeCreateGroupOverlay");
const createGroupSubmitBtn = document.getElementById("createGroupSubmitBtn");

createGroupBtn.addEventListener("click", async () => {
  const userList = document.getElementById("userList");
  overlay.classList.remove("hidden");

  try {
    const response = await fetch(
      "https://chatify-production-7bae.up.railway.app/dashboard/users",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) throw new Error("Failed to fetch users");

    const data = await response.json();
    userList.innerHTML = data.users
      .map(
        (user) => `
            <div class="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <label class="flex items-center gap-2">
                    <input type="checkbox" class="user-checkbox" value="${user.id}">
                    <span>${user.first_name} ${user.last_name}</span>
                </label>
            </div>
        `
      )
      .join("");
  } catch (error) {
    console.error("Error fetching users:", error);
    userList.innerHTML =
      '<div class="text-red-500 p-3">Failed to load users. Please try again.</div>';
  }
});

createGroupSubmitBtn.addEventListener("click", async () => {
  const groupName = document.getElementById("groupName").value.trim();
  const selectedUsers = Array.from(
    document.querySelectorAll(".user-checkbox:checked")
  ).map((cb) => parseInt(cb.value));

  if (!groupName) {
    alert("Please enter a group name");
    return;
  }

  if (selectedUsers.length === 0) {
    alert("Please select at least one member");
    return;
  }

  try {
    const response = await fetch(
      "https://chatify-production-7bae.up.railway.app/groups/create",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: groupName,
          members: selectedUsers,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to create group");
    }

    // Redirect to the group chat page
    window.location.href = `group-chat.html?groupId=${
      result.groupId
    }&groupName=${encodeURIComponent(result.name)}`;
  } catch (error) {
    console.error("Error creating group:", error);
    alert(error.message || "Failed to create group. Please try again.");
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

// Add this near the end of the file, just before or after the DOMContentLoaded event listener
document
  .querySelector(".text-xs.text-gray-500.cursor-pointer")
  .addEventListener("click", () => {
    window.location.href = "profile.html";
  });

// Initialize dashboard
document.addEventListener("DOMContentLoaded", () => {
  updateSidebarUserName();
  updateUserProfile();
  updateDashboard();
});
// Set up periodic dashboard updates
setInterval(updateDashboard, 5000);
