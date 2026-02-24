import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaLock, FaEdit, FaSave, FaTimes, FaCheck, FaArrowLeft } from "react-icons/fa";
import { getUserProfile, updateUserProfile, changePassword } from "../services/profileService";
import "./Profile.css";

/**
 * Profile Component
 * User profile page for viewing and editing account details
 * Features: Edit name/email, change password, error/success notifications
 */
export default function Profile() {
  const navigate = useNavigate();
  const userObj = JSON.parse(localStorage.getItem("user"));
  const userId = userObj?.userID;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [changePwdMode, setChangePwdMode] = useState(false);

  // Fetch profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) {
        navigate("/");
        return;
      }

      try {
        const profile = await getUserProfile(userId);
        setName(profile.name);
        setEmail(profile.email);
        setLoading(false);
      } catch (err) {
        setError("Failed to load profile");
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, navigate]);

  // Handle profile update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim() || !email.trim()) {
      setError("Name and email cannot be empty");
      return;
    }

    try {
      await updateUserProfile(userId, name, email);
      setSuccess("Profile updated successfully!");
      setEditMode(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to update profile");
    }
  };

  // Handle password change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError("All password fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }

    try {
      await changePassword(userId, oldPassword, newPassword);
      setSuccess("Password changed successfully!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setChangePwdMode(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to change password");
    }
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-loading">
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <button 
        className="btn-back"
        onClick={() => navigate("/dashboard")}
      >
        <FaArrowLeft /> Back
      </button>
      <div className="profile-header">
        <div className="profile-avatar">
          <FaUser />
        </div>
        <div className="profile-title">
          <h1>My Profile</h1>
          <p>Manage your account details and security</p>
        </div>
      </div>

      {/* Error & Success Messages */}
      {error && (
        <div className="alert alert-error">
          <FaTimes style={{ marginRight: "8px" }} />
          {error}
        </div>
      )}
      {success && (
        <div className="alert alert-success">
          <FaCheck style={{ marginRight: "8px" }} />
          {success}
        </div>
      )}

      <div className="profile-content">
        {/* Account Information Section */}
        <div className="profile-section">
          <div className="section-header">
            <FaUser className="section-icon" />
            <h2>Account Information</h2>
          </div>

          {!editMode ? (
            <div className="info-display">
              <div className="info-item">
                <label>Full Name</label>
                <p>{name}</p>
              </div>
              <div className="info-item">
                <label>Email Address</label>
                <p>{email}</p>
              </div>
              <button 
                className="btn-edit"
                onClick={() => setEditMode(true)}
              >
                <FaEdit /> Edit Profile
              </button>
            </div>
          ) : (
            <form onSubmit={handleUpdateProfile} className="info-form">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-save">
                  <FaSave /> Save Changes
                </button>
                <button 
                  type="button"
                  className="btn-cancel"
                  onClick={() => setEditMode(false)}
                >
                  <FaTimes /> Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Security Section */}
        <div className="profile-section">
          <div className="section-header">
            <FaLock className="section-icon" />
            <h2>Security</h2>
          </div>

          {!changePwdMode ? (
            <div className="security-display">
              <p className="security-info">Keep your account secure by regularly updating your password</p>
              <button 
                className="btn-change-pwd"
                onClick={() => setChangePwdMode(true)}
              >
                <FaLock /> Change Password
              </button>
            </div>
          ) : (
            <form onSubmit={handleChangePassword} className="password-form">
              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter your current password"
                />
              </div>

              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min. 6 characters)"
                />
              </div>

              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-save">
                  <FaSave /> Update Password
                </button>
                <button 
                  type="button"
                  className="btn-cancel"
                  onClick={() => setChangePwdMode(false)}
                >
                  <FaTimes /> Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
