import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCheck, FaTimes, FaSpinner, FaUserPlus } from 'react-icons/fa';
import * as groupService from '../services/groupService';
import './Group.css';

const InviteGroup = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const userId = user.userID;

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (groupId) {
      fetchGroupDetails();
    }
  }, [groupId]);

  const fetchGroupDetails = async () => {
    try {
      setLoading(true);
      const data = await groupService.getGroupDetails(parseInt(groupId));
      setGroup(data);
      setError('');
    } catch (err) {
      console.error('Failed to fetch group details:', err);
      setError('Group not found or is no longer available');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!userId) {
      setError('You must be logged in to join a group');
      return;
    }

    try {
      setJoining(true);
      await groupService.joinGroup(parseInt(groupId), userId);
      setSuccess('Successfully joined the group!');
      setTimeout(() => {
        navigate('/group');
      }, 2000);
    } catch (err) {
      console.error('Failed to join group:', err);
      setError(err.message || 'Failed to join group');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="group-container">
        <div className="loading-state">
          <FaSpinner className="spinner" />
          <p>Loading group details...</p>
        </div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="group-container">
        <button className="btn-back" onClick={() => navigate('/dashboard')}>
          <FaArrowLeft /> Back to Dashboard
        </button>
        <div className="alert alert-error">
          <FaTimes /> {error || 'Group not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="group-container">
      {/* Back Button */}
      <button className="btn-back" onClick={() => navigate('/dashboard')}>
        <FaArrowLeft /> Back to Dashboard
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

      {/* Main Content */}
      <div className="invite-section">
        <div className="invite-card">
          <div className="invite-icon">
            <FaUserPlus />
          </div>
          
          <h2>You're invited to join</h2>
          
          <div className="group-info">
            <h3>{group.name}</h3>
            {group.description && (
              <p className="group-description">{group.description}</p>
            )}
            
            <div className="group-stats">
              <div className="stat">
                <span className="label">Created by</span>
                <span className="value">{group.createdBy}</span>
              </div>
              <div className="stat">
                <span className="label">Members</span>
                <span className="value">{group.memberCount}</span>
              </div>
            </div>

            {group.members && group.members.length > 0 && (
              <div className="members-preview">
                <h4>Current Members:</h4>
                <ul>
                  {group.members.slice(0, 5).map((member) => (
                    <li key={member.userId}>{member.name}</li>
                  ))}
                  {group.members.length > 5 && (
                    <li className="more-members">+{group.members.length - 5} more</li>
                  )}
                </ul>
              </div>
            )}
          </div>

          <div className="invite-actions">
            <button
              className={`btn-primary ${joining ? 'disabled' : ''}`}
              onClick={handleJoinGroup}
              disabled={joining}
            >
              {joining ? (
                <>
                  <FaSpinner className="spinner" /> Joining...
                </>
              ) : (
                <>
                  <FaUserPlus /> Join Group
                </>
              )}
            </button>
            <button
              className="btn-secondary"
              onClick={() => navigate('/dashboard')}
              disabled={joining}
            >
              <FaArrowLeft /> Decline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteGroup;
