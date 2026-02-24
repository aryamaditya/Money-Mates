/**
 * Profile Service
 * Handles all user profile-related API calls
 */

const API_BASE_URL = "http://localhost:5262";

/**
 * Fetch user profile details
 * @param {number} userId - The user ID to fetch profile for
 * @returns {Promise<Object>} User profile data (id, name, email)
 */
export const getUserProfile = async (userId) => {
  try {
    console.log(`Fetching profile for userId: ${userId}`);
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch profile: ${response.status}`);
    }

    const data = await response.json();
    console.log("Profile data:", data);
    return data;
  } catch (error) {
    console.error("getUserProfile error:", error);
    throw error;
  }
};

/**
 * Update user profile (name and email)
 * @param {number} userId - The user ID to update
 * @param {string} name - New name
 * @param {string} email - New email
 * @returns {Promise<Object>} Updated user data
 */
export const updateUserProfile = async (userId, name, email) => {
  try {
    console.log(`Updating profile for userId: ${userId}`);
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update profile: ${response.status}`);
    }

    const data = await response.json();
    console.log("Profile updated:", data);
    return data;
  } catch (error) {
    console.error("updateUserProfile error:", error);
    throw error;
  }
};

/**
 * Change user password
 * @param {number} userId - The user ID
 * @param {string} oldPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Success message
 */
export const changePassword = async (userId, oldPassword, newPassword) => {
  try {
    console.log(`Changing password for userId: ${userId}`);
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldPassword, newPassword }),
    });

    if (!response.ok) {
      throw new Error(`Failed to change password: ${response.status}`);
    }

    const data = await response.json();
    console.log("Password changed:", data);
    return data;
  } catch (error) {
    console.error("changePassword error:", error);
    throw error;
  }
};
