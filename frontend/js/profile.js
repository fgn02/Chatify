// frontend/js/profile.js
// Initialize Lucide icons
lucide.createIcons();

const token = localStorage.getItem("token");

async function updateUserProfile() {
  try {
    const response = await fetch("/profile", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

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

// Load profile data
async function loadProfile() {
  try {
    const response = await fetch("/profile", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const data = await response.json();
      if (data.isExpired) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "index.html";
        return;
      }
      throw new Error("Failed to fetch profile");
    }

    const data = await response.json();
    const user = data.user;

    // Update form fields
    document.getElementById(
      "fullName"
    ).value = `${user.first_name} ${user.last_name}`;
    document.getElementById("displayName").value =
      user.display_name || user.first_name;

    // Update profile header name and email
    const profileHeaderName = document.querySelector(".profile-header-name");
    const profileHeaderEmail = document.querySelector(".profile-header-email");
    if (profileHeaderName) {
      profileHeaderName.textContent = `${user.first_name} ${user.last_name}`;
    }
    if (profileHeaderEmail) {
      profileHeaderEmail.textContent = user.email;
    }

    // Update sidebar name
    const userNameElement = document.querySelector(".user-name");
    if (userNameElement) {
      userNameElement.textContent = user.display_name || user.first_name;
    }
  } catch (error) {
    console.error("Error loading profile:", error);
    if (error.message.includes("token")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "index.html";
      return;
    }
    alert("Failed to load profile data");
  }
}

// Save profile changes
async function saveProfile() {
  try {
    const fullNameInput = document.getElementById("fullName").value.trim();
    const displayName = document.getElementById("displayName").value.trim();

    // Split full name into first and last name
    const [firstName, ...lastNameParts] = fullNameInput.split(" ");
    const lastName = lastNameParts.join(" ");

    // Prepare update data
    const updateData = {
      first_name: firstName,
      last_name: lastName || "", // In case there's no last name
      display_name: displayName,
    };

    const response = await fetch("/profile/update", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to update profile");
    }

    // Update local storage with new user data
    const userData = JSON.parse(localStorage.getItem("user"));
    if (data.user) {
      userData.display_name = data.user.display_name;
      userData.first_name = data.user.first_name;
      userData.last_name = data.user.last_name;
      localStorage.setItem("user", JSON.stringify(userData));

      // Update UI elements across all pages
      updateUserDisplayName(data.user.display_name, data.user.first_name);

      // Update profile header
      const profileHeaderName = document.querySelector(".profile-header-name");
      if (profileHeaderName) {
        profileHeaderName.textContent = `${data.user.first_name} ${data.user.last_name}`;
      }
    }

    alert("Profile updated successfully!");
  } catch (error) {
    console.error("Error saving profile:", error);
    alert(error.message || "Failed to save profile changes");
  }
}

// Add this function to handle profile picture upload
async function handleProfilePicture() {
  const pictureInput = document.getElementById("pictureInput");
  const profilePicture = document.getElementById("profilePicture");
  const defaultProfileIcon = document.getElementById("defaultProfileIcon");
  const removeButton = document.getElementById("removeProfilePicture");

  // Load existing profile picture if available
  const userData = JSON.parse(localStorage.getItem("user"));
  if (userData?.picture_url) {
    profilePicture.src = `${userData.picture_url}`;
    profilePicture.classList.remove("hidden");
    defaultProfileIcon.classList.add("hidden");
    removeButton.classList.remove("hidden");
  } else {
    removeButton.classList.add("hidden");
  }

  pictureInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append("profile_picture", file);

      try {
        const response = await fetch("/profile/upload-picture", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const data = await response.json();

        if (response.ok) {
          // Update localStorage with new picture URL
          const userData = JSON.parse(localStorage.getItem("user"));
          userData.picture_url = data.picture_url;
          localStorage.setItem("user", JSON.stringify(userData));

          // Update UI
          const profilePicture = document.getElementById("profilePicture");
          const defaultProfileIcon =
            document.getElementById("defaultProfileIcon");

          profilePicture.src = `http://localhost:5000${data.picture_url}`;
          profilePicture.classList.remove("hidden");
          defaultProfileIcon.classList.add("hidden");

          // Update sidebar profile picture
          updateProfilePicture(data.picture_url);
        } else {
          throw new Error(data.error || "Failed to upload picture");
        }
      } catch (error) {
        console.error("Error uploading picture:", error);
        alert(error.message || "Failed to upload picture");
      }
    }
  });

  // Handle remove picture
  removeButton.addEventListener("click", async () => {
    try {
      const response = await fetch("/profile/remove-picture", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to remove picture");
      }

      // Update UI
      profilePicture.classList.add("hidden");
      defaultProfileIcon.classList.remove("hidden");
      removeButton.classList.add("hidden");

      // Update localStorage
      const userData = JSON.parse(localStorage.getItem("user"));
      delete userData.picture_url;
      localStorage.setItem("user", JSON.stringify(userData));

      // Update all profile pictures across the site
      document.querySelectorAll(".profile-picture").forEach((img) => {
        img.src = ""; // Clear the image source
        img.classList.add("hidden");
      });

      alert("Profile picture removed successfully!");
    } catch (error) {
      console.error("Error removing picture:", error);
      alert(error.message || "Failed to remove picture");
    }
  });
}

function handleNavigation() {
  // Chat navigation
  document.getElementById("goToChats").addEventListener("click", () => {
    window.location.href = "dashboard.html";
  });

  // Group navigation
  document.getElementById("goToGroups").addEventListener("click", () => {
    window.location.href = "grpchat-dashboard.html";
  });

  // Logout functionality
  document.getElementById("logoutBtn").addEventListener("click", () => {
    // Clear local storage
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Redirect to login page
    window.location.href = "index.html";
  });
}

// Initialize profile page
document.addEventListener("DOMContentLoaded", () => {
  updateUserProfile();
  loadProfile();
  handleProfilePicture();
  handleNavigation();

  // Add save button event listener
  const saveButton = document.querySelector("button.save-changes");
  if (saveButton) {
    saveButton.addEventListener("click", saveProfile);
  }

  // Add toggle switch listeners
  document.querySelectorAll(".relative.inline-flex").forEach((toggle) => {
    toggle.addEventListener("click", (e) => {
      e.preventDefault();
      const isActive = toggle.classList.contains("bg-indigo-600");
      const span = toggle.querySelector("span");

      if (isActive) {
        toggle.classList.remove("bg-indigo-600");
        toggle.classList.add("bg-gray-200");
        span.style.transform = "translateX(0)";
      } else {
        toggle.classList.add("bg-indigo-600");
        toggle.classList.remove("bg-gray-200");
        span.style.transform = "translateX(1.25rem)";
      }
    });
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  const form =
    document.querySelector("form") || document.getElementById("profileForm");
  const saveButton =
    document.querySelector(".save-changes-btn") ||
    document.querySelector("button[type='submit']");

  // Load initial profile data
  async function loadProfile() {
    try {
      const response = await fetch("/dashboard/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      // Populate form fields
      document.getElementById(
        "fullName"
      ).value = `${data.user.first_name} ${data.user.last_name}`;
      document.getElementById("displayName").value = data.user.display_name;

      // Set toggle states if they exist
      if (document.getElementById("emailNotifications")) {
        document.getElementById("emailNotifications").checked =
          data.user.email_notifications;
      }
      if (document.getElementById("soundNotifications")) {
        document.getElementById("soundNotifications").checked =
          data.user.sound_notifications;
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  }

  // Handle form submission
  saveButton.addEventListener("click", async (e) => {
    e.preventDefault();

    const formData = {
      full_name: document.getElementById("fullName").value,
      display_name: document.getElementById("displayName").value,
      email_notifications:
        document.getElementById("emailNotifications")?.checked || false,
      sound_notifications:
        document.getElementById("soundNotifications")?.checked || false,
    };

    try {
      const response = await fetch("/profile/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        // Update local storage with new display name
        const userData = JSON.parse(localStorage.getItem("user"));
        userData.name = formData.display_name;
        localStorage.setItem("user", JSON.stringify(userData));

        // Show success message
        alert("Profile updated successfully!");
      } else {
        throw new Error(result.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    }
  });

  // Load initial profile data
  loadProfile();
});
