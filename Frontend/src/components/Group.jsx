import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaPlus, FaUserPlus, FaSpinner, FaCheck, FaTimes } from 'react-icons/fa';
import * as groupService from '../services/groupService';
import './Group.css';

const Group = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const userId = user.userID;

  // State management
  const [view, setView] = useState('main'); // 'main', 'create', 'join', 'list'
  const [groups, setGroups] = useState([]);
  const [availableGroups, setAvailableGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [createForm, setCreateForm] = useState({ name: '', description: '' });
  const [joinCode, setJoinCode] = useState('');
  const [inviteLink, setInviteLink] = useState('');

  useEffect(() => {
    if (userId) {
      fetchUserGroups();
    }
  }, [userId]);

  const fetchUserGroups = async () => {
    try {
      setLoading(true);
      const data = await groupService.getUserGroups(userId);
      setGroups(data);
      setError('');
    } catch (err) {
      console.error('Failed to fetch groups:', err);
      setError('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableGroups = async () => {
    try {
      setLoading(true);
      const data = await groupService.getAvailableGroups(userId);
      setAvailableGroups(data);
      setError('');
    } catch (err) {
      console.error('Failed to fetch available groups:', err);
      setError('Failed to load available groups');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim()) {
      setError('Group name is required');
      return;
    }

    try {
      setLoading(true);
      const response = await groupService.createGroup(createForm.name, createForm.description, userId);
      setSuccess('Group created successfully!');
      setInviteLink(response.inviteLink);
      setCreateForm({ name: '', description: '' });
      await fetchUserGroups();
      setTimeout(() => {
        setView('list');
        setSuccess('');
        setInviteLink('');
      }, 3000);
    } catch (err) {
      console.error('Failed to create group:', err);
      setError('Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (groupId) => {
    try {
      setLoading(true);
      await groupService.joinGroup(groupId, userId);
      setSuccess('Successfully joined the group!');
      await fetchUserGroups();
      await fetchAvailableGroups();
      setTimeout(() => {
        setSuccess('');
        setView('list');
      }, 1500);
    } catch (err) {
      console.error('Failed to join group:', err);
      setError(err.message || 'Failed to join group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="group-container">
      {/* Back Button */}
      <button className="btn-back" onClick={() => navigate('/dashboard')}>
        <FaArrowLeft /> Back
      </button>

      {/* Alert Messages */}
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

      {/* Main View - Create or Join Options */}
      {view === 'main' && (
        <div className="group-main">
          <div className="group-header">
            <h1>Groups</h1>
            <p>Manage expenses with friends and family</p>
          </div>

          <div className="group-options">
            <button
              className="option-card create-card"
              onClick={() => setView('create')}
            >
              <div className="option-icon create-icon">
                <FaPlus />
              </div>
              <h3>Create Group</h3>
              <p>Start a new group and invite members</p>
            </button>

            <button
              className="option-card join-card"
              onClick={() => {
                setView('join');
                fetchAvailableGroups();
              }}
            >
              <div className="option-icon join-icon">
                <FaUserPlus />
              </div>
              <h3>Join Group</h3>
              <p>Join an existing group</p>
            </button>
          </div>

          {groups.length > 0 && (
            <button
              className="view-groups-btn"
              onClick={() => setView('list')}
            >
              View Your {groups.length} Group{groups.length !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      )}

      {/* Create Group View */}
      {view === 'create' && (
        <div className="group-form-container">
          <div className="form-header">
            <button className="btn-back-small" onClick={() => setView('main')}>
              <FaArrowLeft />
            </button>
            <h2>Create New Group</h2>
          </div>

          <form onSubmit={handleCreateGroup} className="group-form">
            <div className="form-group">
              <label>Group Name *</label>
              <input
                type="text"
                placeholder="Enter group name"
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm({ ...createForm, name: e.target.value })
                }
                required
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                placeholder="Enter group description (optional)"
                value={createForm.description}
                onChange={(e) =>
                  setCreateForm({ ...createForm, description: e.target.value })
                }
                rows="4"
              />
            </div>

            <button
              type="submit"
              className="btn-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <FaSpinner className="spinner" /> Creating...
                </>
              ) : (
                <>
                  <FaPlus /> Create Group
                </>
              )}
            </button>
          </form>

          {inviteLink && (
            <div className="invite-link-card">
              <h3>Share this invite link with your friends:</h3>
              <div className="invite-link-display">
                <input 
                  type="text" 
                  value={inviteLink} 
                  readOnly 
                  className="invite-link-input"
                />
                <button 
                  className="btn-copy"
                  onClick={() => {
                    navigator.clipboard.writeText(inviteLink);
                    setSuccess('Invite link copied to clipboard!');
                    setTimeout(() => setSuccess(''), 2000);
                  }}
                >
                  Copy Link
                </button>
              </div>
              <p className="invite-hint">Anyone with this link can join the group</p>
            </div>
          )}
        </div>
      )}

      {/* Join Group View */}
      {view === 'join' && (
        <div className="group-form-container">
          <div className="form-header">
            <button className="btn-back-small" onClick={() => setView('main')}>
              <FaArrowLeft />
            </button>
            <h2>Join a Group</h2>
          </div>

          {loading && availableGroups.length === 0 ? (
            <div className="loading-spinner">
              <FaSpinner className="spinner" />
              <p>Loading available groups...</p>
            </div>
          ) : availableGroups.length === 0 ? (
            <div className="no-groups">
              <p>No available groups to join at the moment</p>
            </div>
          ) : (
            <div className="groups-list">
              {availableGroups.map((group) => (
                <div key={group.id} className="group-card">
                  <div className="group-card-header">
                    <h3>{group.name}</h3>
                    <span className="members-badge">{group.memberCount} members</span>
                  </div>
                  {group.description && (
                    <p className="group-description">{group.description}</p>
                  )}
                  <div className="group-card-footer">
                    <small>Created by {group.createdBy}</small>
                    <button
                      className="btn-join"
                      onClick={() => handleJoinGroup(group.id)}
                      disabled={loading}
                    >
                      <FaUserPlus /> Join
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Groups List View */}
      {view === 'list' && (
        <div className="group-form-container">
          <div className="form-header">
            <button className="btn-back-small" onClick={() => setView('main')}>
              <FaArrowLeft />
            </button>
            <h2>Your Groups</h2>
          </div>

          {loading ? (
            <div className="loading-spinner">
              <FaSpinner className="spinner" />
              <p>Loading groups...</p>
            </div>
          ) : groups.length === 0 ? (
            <div className="no-groups">
              <p>You haven't joined any groups yet</p>
            </div>
          ) : (
            <div className="groups-list">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="group-card your-group"
                  onClick={() => navigate(`/groups/${group.id}/chat`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="group-card-header">
                    <h3>{group.name}</h3>
                    <span className="members-badge">{group.memberCount} members</span>
                  </div>
                  {group.description && (
                    <p className="group-description">{group.description}</p>
                  )}
                  <div className="group-info">
                    <small>Created by {group.createdBy}</small>
                    <small>Joined on {new Date(group.joinedDate).toLocaleDateString()}</small>
                  </div>
                  <div className="members-section">
                    <h4>Members:</h4>
                    <ul className="members-list">
                      {group.members.map((member) => (
                        <li key={member.id}>{member.name}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Group;
