/**
 * groupService.js - Service for group API calls
 */

const BASE_URL = 'http://localhost:5262/api/group';

/**
 * Create a new group
 * @param {string} name - Group name
 * @param {string} description - Group description
 * @param {number} userId - ID of user creating the group
 * @returns {Promise<Object>} - Created group data
 */
export const createGroup = async (name, description, userId) => {
  try {
    const response = await fetch(`${BASE_URL}/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        description,
        createdBy: userId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error creating group: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error in createGroup:', error);
    throw error;
  }
};

/**
 * Get all groups for a user
 * @param {number} userId - User ID
 * @returns {Promise<Array>} - List of groups
 */
export const getUserGroups = async (userId) => {
  try {
    const response = await fetch(`${BASE_URL}/user/${userId}`);

    if (!response.ok) {
      throw new Error(`Error fetching user groups: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error in getUserGroups:', error);
    throw error;
  }
};

/**
 * Get group details
 * @param {number} groupId - Group ID
 * @returns {Promise<Object>} - Group details
 */
export const getGroupDetails = async (groupId) => {
  try {
    const response = await fetch(`${BASE_URL}/${groupId}`);

    if (!response.ok) {
      throw new Error(`Error fetching group details: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error in getGroupDetails:', error);
    throw error;
  }
};

/**
 * Join a group using invite code
 * @param {string} inviteCode - Invite code for the group
 * @param {number} userId - User ID joining the group
 * @returns {Promise<Object>} - Response message with group details
 */
export const joinGroup = async (inviteCode, userId) => {
  try {
    const response = await fetch(`${BASE_URL}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inviteCode,
        userId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error joining group: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error in joinGroup:', error);
    throw error;
  }
};

/**
 * Get available groups (groups user hasn't joined yet)
 * @param {number} userId - User ID
 * @returns {Promise<Array>} - List of available groups
 */
export const getAvailableGroups = async (userId) => {
  try {
    const response = await fetch(`${BASE_URL}/all/available/${userId}`);

    if (!response.ok) {
      throw new Error(`Error fetching available groups: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error in getAvailableGroups:', error);
    throw error;
  }
};

/**
 * Leave a group
 * @param {number} groupId - Group ID
 * @param {number} userId - User ID leaving the group
 * @returns {Promise<Object>} - Response message
 */
export const leaveGroup = async (groupId, userId) => {
  try {
    const response = await fetch(`${BASE_URL}/leave`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        groupId,
        userId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Error leaving group: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error in leaveGroup:', error);
    throw error;
  }
};
