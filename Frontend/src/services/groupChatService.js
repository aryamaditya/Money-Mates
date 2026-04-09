import * as signalR from "@microsoft/signalr";

/**
 * groupChatService.js - Service for group chat with real-time updates
 */

const BASE_URL = "http://localhost:5262";
const HUB_URL = `${BASE_URL}/hubs/groupchat`;

let connection = null;

/**
 * Initialize SignalR connection for real-time messaging
 */
export const initializeConnection = async () => {
  if (connection && connection.state === signalR.HubConnectionState.Connected) {
    return connection;
  }

  connection = new signalR.HubConnectionBuilder()
    .withUrl(HUB_URL)
    .withAutomaticReconnect()
    .build();

  try {
    await connection.start();
    
    // Wait to ensure connection is fully established
    let retries = 0;
    while (connection.state !== signalR.HubConnectionState.Connected && retries < 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      retries++;
    }
    
    if (connection.state !== signalR.HubConnectionState.Connected) {
      throw new Error("Connection failed to reach Connected state");
    }
    
    console.log("SignalR connected successfully");
    return connection;
  } catch (err) {
    console.error("Failed to connect SignalR:", err);
    throw err;
  }
};

/**
 * Get all messages for a group
 */
export const getGroupMessages = async (groupId) => {
  try {
    const response = await fetch(
      `${BASE_URL}/api/groupmessage/group/${groupId}`
    );
    if (!response.ok) {
      throw new Error(`Error fetching messages: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error in getGroupMessages:", error);
    throw error;
  }
};

/**
 * Join a group chat room
 */
export const joinGroup = async (groupId, userId) => {
  try {
    // Convert to numbers to ensure proper JSON serialization
    const gId = Number(groupId);
    const uId = Number(userId);
    
    console.log(`joinGroup: Checking connection state. groupId=${gId}, userId=${uId}`);
    
    // Ensure connection is initialized and connected
    if (!connection || connection.state !== signalR.HubConnectionState.Connected) {
      console.log("joinGroup: Connection not ready, initializing...");
      await initializeConnection();
    }
    
    console.log(`joinGroup: Connection state is ${connection.state}, invoking JoinGroup with int params`);
    await connection.invoke("JoinGroup", gId, uId);
    console.log("joinGroup: Successfully invoked JoinGroup");
  } catch (error) {
    console.error("Error in joinGroup:", error);
    throw error;
  }
};

/**
 * Leave a group chat room
 */
export const leaveGroup = async (groupId, userId) => {
  try {
    // Convert to numbers to ensure proper JSON serialization
    const gId = Number(groupId);
    const uId = Number(userId);
    
    // Only invoke if connection exists and is in Connected state
    if (connection && connection.state === signalR.HubConnectionState.Connected) {
      await connection.invoke("LeaveGroup", gId, uId);
    }
  } catch (error) {
    console.error("Error leaving group:", error);
    // Don't throw - just log the error since the connection might already be closing
  }
};

/**
 * Send a message to the group
 */
export const sendMessage = async (groupId, senderId, content, fileUrl = null, fileType = null) => {
  try {
    // Convert to numbers to ensure proper JSON serialization
    const gId = Number(groupId);
    const sId = Number(senderId);
    
    // Ensure connection is initialized and connected
    if (!connection || connection.state !== signalR.HubConnectionState.Connected) {
      await initializeConnection();
    }
    await connection.invoke("SendMessage", gId, sId, content, fileUrl, fileType);
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

/**
 * Upload a file (image or audio)
 */
export const uploadFile = async (file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${BASE_URL}/api/groupmessage/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Error uploading file: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error in uploadFile:", error);
    throw error;
  }
};

/**
 * Listen for incoming messages (real-time)
 */
export const onReceiveMessage = (callback) => {
  if (connection) {
    // Remove any existing listeners first to prevent duplicates
    connection.off("ReceiveMessage");
    connection.on("ReceiveMessage", callback);
  }
};

/**
 * Listen for user joined event
 */
export const onUserJoined = (callback) => {
  if (connection) {
    // Remove any existing listeners first to prevent duplicates
    connection.off("UserJoined");
    connection.on("UserJoined", callback);
  }
};

/**
 * Listen for user left event
 */
export const onUserLeft = (callback) => {
  if (connection) {
    // Remove any existing listeners first to prevent duplicates
    connection.off("UserLeft");
    connection.on("UserLeft", callback);
  }
};

/**
 * Remove all listeners
 */
export const removeAllListeners = () => {
  if (connection) {
    connection.off("ReceiveMessage");
    connection.off("UserJoined");
    connection.off("UserLeft");
    connection.off("Error");
  }
};

/**
 * Disconnect from SignalR
 */
export const disconnect = async () => {
  if (connection) {
    try {
      await connection.stop();
      connection = null;
      console.log("SignalR disconnected");
    } catch (err) {
      console.error("Error disconnecting:", err);
    }
  }
};
