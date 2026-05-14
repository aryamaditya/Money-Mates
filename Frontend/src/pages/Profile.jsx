import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaLock, FaEdit, FaSave, FaTimes, FaCheck, FaArrowLeft, FaShieldAlt, FaBell, FaSignOutAlt, FaClock, FaEnvelope, FaPhone } from "react-icons/fa";
import { getUserProfile, updateUserProfile, changePassword } from "../services/profileService";
import exportService from "../services/exportService";
import styles from "./Profile.css";

/**
 * Profile Component - Completely Redesigned
 * Modern, professional UI with enhanced UX
 * Features: Edit profile, change password, account statistics, notification preferences
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
  const [activeTab, setActiveTab] = useState("account");
  const [exporting, setExporting] = useState(false);

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

  // Handle data export to CSV
  const handleExportData = async () => {
    setExporting(true);
    setError("");
    setSuccess("");
    try {
      await exportService.exportCurrentMonthData(userId, "combined");
      setSuccess("Data exported successfully! Check your downloads folder.");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message || "Failed to export data");
      setTimeout(() => setError(""), 4000);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="profileContainer">
        <div className="profileSpinner">
          <div className="spinnerDot"></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profileContainer">
      {/* Top Navigation Bar */}
      <div className="profileTopBar">
        <button className="profileBackBtn" onClick={() => navigate("/dashboard")}>
          <FaArrowLeft />
        </button>
        <h1>Account Settings</h1>
        <div style={{ width: "40px" }}></div>
      </div>

      {/* Hero Section */}
      <div className="profileHero">
        <div className="profileAvatarLarge">
          <FaUser />
        </div>
        <div className="profileHeroContent">
          <h2>{name}</h2>
          <p>{email}</p>
          <div className="profileHeroStats">
            <div className="heroStat">
              <FaClock size={16} />
              <span>Member since {new Date().getFullYear()}</span>
            </div>
            <div className="heroStat">
              <FaShieldAlt size={16} />
              <span>Account Secure</span>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="alertBox alertError">
          <FaTimes />
          <span>{error}</span>
          <button onClick={() => setError("")}><FaTimes /></button>
        </div>
      )}
      {success && (
        <div className="alertBox alertSuccess">
          <FaCheck />
          <span>{success}</span>
          <button onClick={() => setSuccess("")}><FaTimes /></button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tabNavigation">
        <button 
          className={`tabBtn ${activeTab === "account" ? "active" : ""}`}
          onClick={() => setActiveTab("account")}
        >
          <FaUser />
          <span>Account</span>
        </button>
        <button 
          className={`tabBtn ${activeTab === "security" ? "active" : ""}`}
          onClick={() => setActiveTab("security")}
        >
          <FaLock />
          <span>Security</span>
        </button>
        <button 
          className={`tabBtn ${activeTab === "preferences" ? "active" : ""}`}
          onClick={() => setActiveTab("preferences")}
        >
          <FaBell />
          <span>Preferences</span>
        </button>
      </div>

      {/* Content Sections */}
      <div className="profileContent">
        {/* Account Tab */}
        {activeTab === "account" && (
          <div className="tabContent accountTab">
            <div className="sectionHeader">
              <h3>Account Information</h3>
              {!editMode && (
                <button className="editBtn" onClick={() => setEditMode(true)}>
                  <FaEdit /> Edit
                </button>
              )}
            </div>

            {!editMode ? (
              <div className="infoGrid">
                <div className="infoCard">
                  <div className="infoIcon"><FaUser /></div>
                  <div className="infoText">
                    <label>Full Name</label>
                    <p>{name}</p>
                  </div>
                </div>
                <div className="infoCard">
                  <div className="infoIcon"><FaEnvelope /></div>
                  <div className="infoText">
                    <label>Email Address</label>
                    <p>{email}</p>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUpdateProfile} className="editForm">
                <div className="formGroup">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="formInput"
                  />
                </div>

                <div className="formGroup">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="formInput"
                  />
                </div>

                <div className="formActions">
                  <button type="submit" className="btnPrimary">
                    <FaSave /> Save Changes
                  </button>
                  <button 
                    type="button" 
                    className="btnSecondary"
                    onClick={() => setEditMode(false)}
                  >
                    <FaTimes /> Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Security Tab */}
        {activeTab === "security" && (
          <div className="tabContent securityTab">
            <div className="sectionHeader">
              <h3>Security Settings</h3>
            </div>

            {!changePwdMode ? (
              <div className="securityInfo">
                <div className="securityCard">
                  <div className="securityCardIcon">
                    <FaShieldAlt />
                  </div>
                  <div className="securityCardContent">
                    <h4>Password</h4>
                    <p>Keep your account safe by using a strong password</p>
                    <button 
                      className="btnPrimary" 
                      onClick={() => setChangePwdMode(true)}
                    >
                      <FaLock /> Change Password
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleChangePassword} className="editForm">
                <div className="formGroup">
                  <label>Current Password</label>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="formInput"
                  />
                </div>

                <div className="formDivider"></div>

                <div className="formGroup">
                  <label>New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 6 characters)"
                    className="formInput"
                  />
                </div>

                <div className="formGroup">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="formInput"
                  />
                </div>

                <div className="formActions">
                  <button type="submit" className="btnPrimary">
                    <FaSave /> Update Password
                  </button>
                  <button 
                    type="button" 
                    className="btnSecondary"
                    onClick={() => setChangePwdMode(false)}
                  >
                    <FaTimes /> Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === "preferences" && (
          <div className="tabContent preferencesTab">
            <div className="sectionHeader">
              <h3>Preferences</h3>
            </div>

            <div className="preferencesList">
              <div className="preferenceItem">
                <div className="preferenceInfo">
                  <h4>Email Notifications</h4>
                  <p>Receive updates about your account activity</p>
                </div>
                <label className="toggle">
                  <input type="checkbox" defaultChecked />
                  <span></span>
                </label>
              </div>

              <div className="preferenceItem">
                <div className="preferenceInfo">
                  <h4>Two-Factor Authentication</h4>
                  <p>Add an extra layer of security to your account</p>
                </div>
                <label className="toggle">
                  <input type="checkbox" />
                  <span></span>
                </label>
              </div>

              <div className="preferenceItem">
                <div className="preferenceInfo">
                  <h4>Marketing Communications</h4>
                  <p>Receive news and updates about Money-Mates</p>
                </div>
                <label className="toggle">
                  <input type="checkbox" defaultChecked />
                  <span></span>
                </label>
              </div>

              <div className="preferenceItem">
                <div className="preferenceInfo">
                  <h4>Data Export</h4>
                  <p>Download your account data and transactions</p>
                </div>
                <button 
                  className="btnSecondary" 
                  onClick={handleExportData}
                  disabled={exporting}
                >
                  <FaSave /> {exporting ? "Exporting..." : "Download"}
                </button>
              </div>
            </div>

            <div className="dangerZone">
              <h4>Danger Zone</h4>
              <button className="btnDanger" onClick={() => {
                if (window.confirm("Are you sure you want to log out?")) {
                  localStorage.clear();
                  navigate("/");
                }
              }}>
                <FaSignOutAlt /> Log Out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
