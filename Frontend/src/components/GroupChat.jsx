import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FaArrowLeft,
  FaPaperPlane,
  FaSpinner,
  FaCheck,
  FaTimes,
  FaShareAlt,
  FaComments,
  FaMoneyBillWave,
} from 'react-icons/fa';
import * as groupChatService from '../services/groupChatService';
import * as groupService from '../services/groupService';
import GroupExpense from './GroupExpense';
import './GroupChat.css';

const GroupChat = () => {
  const navigate = useNavigate();
  const { groupId } = useParams();
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const userId = user.userID;

  // State
  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'expenses'

  // Refs
  const messagesEndRef = useRef(null);

  // Load group info and messages on mount
  useEffect(() => {
    if (groupId && userId) {
      loadGroupData();
    }

    // Cleanup listeners when component unmounts or when groupId/userId changes
    return () => {
      groupChatService.removeAllListeners();
    };
  }, [groupId, userId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadGroupData = async () => {
    try {
      setLoading(true);
      console.log(`Loading group data for groupId=${groupId}, userId=${userId}`);
      
      // Load group details
      const groupData = await groupService.getGroupDetails(groupId);
      setGroup(groupData);
      console.log('Group data loaded:', groupData);

      // Load messages
      const messagesData = await groupChatService.getGroupMessages(groupId);
      setMessages(messagesData);
      console.log('Messages loaded:', messagesData.length);

      // Initialize real-time connection
      await groupChatService.initializeConnection();
      console.log('Connection initialized');
      
      // Join group chat
      await groupChatService.joinGroup(groupId, userId);
      console.log('Joined group chat');

      // Listen for real-time messages
      groupChatService.onReceiveMessage((message) => {
        setMessages((prev) => {
          // Check if message already exists to prevent duplicates
          const messageExists = prev.some(m => m.id === message.id);
          if (messageExists) {
            console.log('Message already exists, skipping duplicate:', message.id);
            return prev;
          }
          console.log('Adding new message:', message.id);
          return [...prev, message];
        });
      });

      // Listen for user joined
      groupChatService.onUserJoined((data) => {
        setSuccess(`${data.userName} joined the chat`);
        setTimeout(() => setSuccess(''), 3000);
      });

      // Listen for user left
      groupChatService.onUserLeft((data) => {
        setSuccess(`${data.userName} left the chat`);
        setTimeout(() => setSuccess(''), 3000);
      });

      setError('');
    } catch (err) {
      console.error('Failed to load group data:', err);
      setError('Failed to load group data');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    try {
      setLoading(true);
      await groupChatService.sendMessage(groupId, userId, messageInput);
      setMessageInput('');
      setError('');
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message');
    } finally {
      setLoading(false);
    }
  };



  // Clean up on unmount
  useEffect(() => {
    return async () => {
      try {
        if (groupId && userId) {
          // Try to notify the server that we're leaving (only if connection is active)
          await groupChatService.leaveGroup(groupId, userId);
        }
        // Remove all event listeners
        groupChatService.removeAllListeners();
        // Disconnect from SignalR
        await groupChatService.disconnect();
      } catch (err) {
        console.error("Error during cleanup:", err);
      }
    };
  }, [groupId, userId]);

  if (loading && !group) {
    return (
      <div className="chat-loading">
        <FaSpinner className="spinner" />
        <p>Loading chat...</p>
      </div>
    );
  }

  return (
    <div className="group-chat-container">
      {/* Header */}
      <div className="chat-header">
        <button className="btn-back-chat" onClick={() => navigate('/groups')}>
          <FaArrowLeft />
        </button>
        <div className="header-info">
          <h2>{group?.name}</h2>
          <p>{group?.memberCount} members</p>
        </div>
        <button 
          className="btn-invite-chat"
          onClick={() => setShowInviteModal(true)}
          title="Invite people to this group"
        >
          <FaShareAlt /> Invite
        </button>
      </div>

      {/* Tabs */}
      <div className="chat-tabs">
        <button
          className={`tab-button ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          <FaComments /> Chat
        </button>
        <button
          className={`tab-button ${activeTab === 'expenses' ? 'active' : ''}`}
          onClick={() => setActiveTab('expenses')}
        >
          <FaMoneyBillWave /> Expenses
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-error">
          <FaTimes /> {error}
        </div>
      )}
      {success && (
        <div className="alert alert-success">
          <FaCheck /> {success}
        </div>
      )}

      {/* Messages Container - Chat Tab */}
      {activeTab === 'chat' && (
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={`${message.id}-${message.sentAt}-${index}`}
              className={`message ${
                message.senderId === userId ? 'own-message' : 'other-message'
              }`}
            >
              <div className="message-header">
                <span className="sender-name">{message.senderName}</span>
                <span className="message-time">
                  {new Date(message.sentAt).toLocaleTimeString()}
                </span>
              </div>

              <div className="message-content">
                <p>{message.content}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      )}

      {/* Expenses Tab */}
      {activeTab === 'expenses' && (
        <div className="expenses-container">
          <GroupExpense 
            groupId={groupId} 
            userId={userId} 
            groupMembers={group?.members}
          />
        </div>
      )}

      {/* Input Area - Only show in chat tab */}
      {activeTab === 'chat' && (
      <div className="chat-input-area">
        <form onSubmit={handleSendMessage} className="message-form">
          <div className="input-wrapper">
            <input
              type="text"
              placeholder="Type a message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
            />

            <div className="input-buttons">
              <button
                type="submit"
                className="btn-send"
                disabled={loading || !messageInput.trim()}
              >
                <FaPaperPlane />
              </button>
            </div>
          </div>
        </form>


      </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
          <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Invite to {group?.name}</h3>
                <button 
                  className="btn-close-modal"
                  onClick={() => setShowInviteModal(false)}
                >
                  <FaTimes />
                </button>
              </div>
              
              <div className="modal-body">
                <p>Share this link with your friends to invite them to the group:</p>
                
                <div className="invite-link-box">
                  <input 
                    type="text" 
                    value={group?.inviteLink || `http://localhost:3000/group/invite/${group?.inviteCode}`}
                    readOnly 
                    className="invite-link-input"
                  />
                  <button 
                    className="btn-copy-invite"
                    onClick={() => {
                      const linkToCopy = group?.inviteLink || `http://localhost:3000/group/invite/${group?.inviteCode}`;
                      navigator.clipboard.writeText(linkToCopy);
                      setSuccess('Invite link copied to clipboard!');
                    }}
                  >
                    Copy Link
                  </button>
                </div>

                <p className="hint-text">Anyone with this link can join the group</p>

                <div className="members-section">
                  <h4>Current Members ({group?.memberCount}):</h4>
                  <ul className="members-list-modal">
                    {group?.members?.map((member) => (
                      <li key={member.userId}>{member.name}</li>
                    )) || <li>No members</li>}
                  </ul>
                </div>
              </div>
            </div>
          </div>
      )}
    </div>
  );
};

export default GroupChat;
