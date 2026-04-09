import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaPlus, FaUserPlus, FaSpinner, FaCheck, FaTimes, FaSignOutAlt } from 'react-icons/fa';
import * as groupService from '../services/groupService';
import './Group.css';

const Group = () => {
  const navigate = useNavigate();
  const { inviteCode } = useParams(); // Get invite code from URL if present
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const userId = user.userID;

  // State management
  const [view, setView] = useState('main'); // 'main', 'create', 'join', 'list'
  const [groups, setGroups] = useState([]);

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
      
      // If user came via invite link, auto-join
      if (inviteCode) {
        handleJoinGroupWithCode(inviteCode);
      }
    }
  }, [userId, inviteCode]);

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
    } catch (err) {
      console.error('Failed to create group:', err);
      setError('Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (inviteInput) => {
    try {
      setLoading(true);
      // Extract invite code from link if user pasted a full link
      let code = inviteInput.trim();
      
      // If it's a full URL, extract the code from the end
      if (code.includes('/')) {
        code = code.split('/').pop();
      }
      
      if (!code) {
        setError('Please enter a valid invite code or link');
        setLoading(false);
        return;
      }

      await groupService.joinGroup(code, userId);
      setSuccess('Successfully joined the group!');
      setJoinCode('');
      await fetchUserGroups();
      setTimeout(() => {
        setSuccess('');
        setView('list');
      }, 1500);
    } catch (err) {
      console.error('Failed to join group:', err);
      setError(err.message || 'Failed to join group. Check your invite code/link.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseInviteLink = () => {
    setInviteLink('');
    setSuccess('');
  };

  const handleViewGroupsList = () => {
    setInviteLink('');
    setSuccess('');
    setView('list');
  };

  const handleJoinGroupWithCode = async (code) => {
    try {
      setLoading(true);
      setView('main'); // Show loading state on main view
      await groupService.joinGroup(code, userId);
      setSuccess(`Successfully joined the group!`);
      await fetchUserGroups();
      setTimeout(() => {
        setSuccess('');
        setView('list');
      }, 2000);
    } catch (err) {
      console.error('Failed to join group with code:', err);
      setError('Invalid invite link or you might already be a member of this group');
      setView('main');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGroup = async (groupId) => {
    if (!window.confirm('Are you sure you want to leave this group?')) {
      return;
    }

    try {
      setLoading(true);
      await groupService.leaveGroup(groupId, userId);
      setSuccess('You have left the group');
      await fetchUserGroups();
    } catch (err) {
      console.error('Failed to leave group:', err);
      setError(err.message || 'Failed to leave group');
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
              onClick={() => setView('join')}
            >
              <div className="option-icon join-icon">
                <FaUserPlus />
              </div>
              <h3>Join Group</h3>
              <p>Join an existing group with invite link</p>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ margin: 0 }}>Share this invite link with your friends:</h3>
                <button 
                  onClick={handleCloseInviteLink}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: '#666',
                    padding: '0',
                    width: '30px',
                    height: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Close"
                >
                  ✕
                </button>
              </div>
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
                  }}
                >
                  Copy Link
                </button>
              </div>
              <p className="invite-hint">Anyone with this link can join the group</p>
              <button 
                className="btn-primary" 
                onClick={handleViewGroupsList}
                style={{ marginTop: '12px', width: '100%' }}
              >
                View Your Groups
              </button>
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

          <form onSubmit={(e) => {
            e.preventDefault();
            if (joinCode.trim()) {
              handleJoinGroup(joinCode);
            }
          }} className="group-form">
            <div className="form-group">
              <label>Invite Link or Code *</label>
              <input
                type="text"
                placeholder="Paste the invite link or code (e.g., http://localhost:3000/group/invite/ABC12XYZ or just ABC12XYZ)"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
              />
              <p className="form-hint">Paste the invite link that the group creator shared with you</p>
            </div>

            <button
              type="submit"
              className="btn-submit"
              disabled={loading || !joinCode.trim()}
            >
              {loading ? (
                <>
                  <FaSpinner className="spinner" /> Joining...
                </>
              ) : (
                <>
                  <FaUserPlus /> Join Group
                </>
              )}
            </button>
          </form>
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
                >
                  <div 
                    onClick={() => navigate(`/groups/${group.id}/chat`)}
                    style={{ cursor: 'pointer', flex: 1 }}
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
                  <button
                    className="btn-leave-group"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLeaveGroup(group.id);
                    }}
                    disabled={loading}
                    title="Leave this group"
                  >
                    <FaSignOutAlt /> Leave
                  </button>
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
