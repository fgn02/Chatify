// Update user display name and profile picture across all pages
function updateUserDisplayName(displayName, firstName) {
  // Update elements with class "user-name"
  const userNameElements = document.querySelectorAll(".user-name");
  userNameElements.forEach((element) => {
    element.textContent = displayName || firstName;
  });

  // Update elements with class "profile-name"
  const profileNameElements = document.querySelectorAll(".profile-name");
  profileNameElements.forEach((element) => {
    element.textContent = displayName || firstName;
  });
}

function updateProfilePicture(pictureUrl) {
  // Only update the sidebar profile picture
  const sidebarProfileContainer = document.querySelector(
    ".p-4.border-t.border-gray-200 .w-8.h-8.bg-gray-200.rounded-full"
  );

  if (sidebarProfileContainer) {
    // Clear existing content
    sidebarProfileContainer.innerHTML = "";

    if (pictureUrl) {
      // Create and add image
      const img = document.createElement("img");
      img.src = `https://chatify-production-7bae.up.railway.app${pictureUrl}`;
      img.alt = "Profile Picture";
      img.className = "w-full h-full object-cover rounded-full";
      sidebarProfileContainer.appendChild(img);
    } else {
      // Add default user icon if no picture
      const icon = document.createElement("i");
      icon.setAttribute("data-lucide", "user");
      icon.className = "w-4 h-4 text-gray-600";
      sidebarProfileContainer.appendChild(icon);
      lucide.createIcons();
    }
  }
}

// Load user info in sidebar for all pages
function loadUserInfo() {
  const userData = JSON.parse(localStorage.getItem("user"));
  if (userData) {
    const displayName = userData.display_name || userData.first_name;
    updateUserDisplayName(displayName, userData.first_name);
    updateProfilePicture(userData.picture_url);
  }
}

// Call this when the DOM is loaded with a slight delay
document.addEventListener("DOMContentLoaded", () => {
  // Initial load
  loadUserInfo();

  // Run again after a short delay to ensure it overrides other scripts
  setTimeout(loadUserInfo, 100);
});
