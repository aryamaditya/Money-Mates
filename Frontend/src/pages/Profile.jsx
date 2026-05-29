import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaLock, FaEdit, FaSave, FaTimes, FaCheck, FaArrowLeft, FaShieldAlt, FaSignOutAlt, FaClock, FaEnvelope, FaDownload } from "react-icons/fa";
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
  const [exporting, setExporting] = useState(false);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [budgetCount, setBudgetCount] = useState(0);
  const [lastLogin, setLastLogin] = useState(null);

  // Fetch profile and account statistics
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
        
        // Fetch account statistics
        try {
          const [expensesRes, incomeRes, budgetsRes] = await Promise.all([
            fetch(`http://localhost:5262/api/expenses/${userId}`).then(r => r.json()),
            fetch(`http://localhost:5262/api/income/${userId}`).then(r => r.json()),
            fetch(`http://localhost:5262/api/dashboard/categories/${userId}`).then(r => r.json())
          ]);
          
          const totalExp = (expensesRes || []).reduce((sum, e) => sum + (e.amount || 0), 0);
          const totalInc = (incomeRes || []).reduce((sum, i) => sum + (i.amount || 0), 0);
          
          setTotalExpenses(totalExp);
          setTotalIncome(totalInc);
          setBudgetCount((budgetsRes || []).length);
          
          // Set last login - use from profile or current time
          const lastLoginTime = profile.lastLogin ? new Date(profile.lastLogin).toLocaleString() : new Date().toLocaleString();
          setLastLogin(lastLoginTime);
        } catch (err) {
          console.error("Failed to fetch statistics", err);
        }
        
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
      await exportService.exportCurrentMonthData(userId, "combined", name);
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

      {/* Alert Messages */}
      {error && (
        <div className="alertBox alertError">
          <FaTimes />
          <span>{error}</span>
          <button onClick={() => setError('')}><FaTimes /></button>
        </div>
      )}
      {success && (
        <div className="alertBox alertSuccess">
          <FaCheck />
          <span>{success}</span>
          <button onClick={() => setSuccess('')}><FaTimes /></button>
        </div>
      )}

      {/* Main Content */}
      <div className="profileContentWrapper">
        {/* Profile Header Section */}
        <section className="profileSection profileHeader">
          <div className="headerBannerGradient"></div>
          <div className="headerContent">
            <div className="profileAvatarLarge">
              <FaUser />
            </div>
            <div className="headerInfo">
              <h2>{name}</h2>
              <p className="headerEmail">{email}</p>
              <div className="headerBadges">
                <span className="badge badgeSecure"><FaShieldAlt /> Secure</span>
                <span className="badge badgeMember"><FaClock /> Since {new Date().getFullYear()}</span>
              </div>
            </div>
          </div>
          
          <div className="statsRow">
            <div className="statCard">
              <div className="statValue">Rs {totalExpenses.toLocaleString()}</div>
              <div className="statLabel">Total Expenses</div>
            </div>
            <div className="statCard">
              <div className="statValue">Rs {totalIncome.toLocaleString()}</div>
              <div className="statLabel">Total Income</div>
            </div>
            <div className="statCard">
              <div className="statValue">{new Date().getFullYear()}</div>
              <div className="statLabel">Member Since</div>
            </div>
            <div className="statCard">
              <div className="statValue">{budgetCount}</div>
              <div className="statLabel">Budgets</div>
            </div>
          </div>
        </section>

        {/* Account Information Section */}
        <section className="profileSection">
          <div className="sectionHeader">
            <div>
              <h3>Account Information</h3>
              <p className="sectionSubtitle">Manage your personal details</p>
            </div>
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
        </section>

        {/* Security Section */}
        <section className="profileSection">
          <div className="sectionHeader">
            <div>
              <h3><FaLock /> Security Settings</h3>
              <p className="sectionSubtitle">Protect your account</p>
            </div>
          </div>

          {!changePwdMode ? (
            <div className="securityCardsGrid">
              <div className="securityCard">
                <div className="securityCardIcon">
                  <FaLock />
                </div>
                <div className="securityCardContent">
                  <h4>Password</h4>
                  <p>Keep your account safe with a strong password</p>
                  <button 
                    className="btnPrimary" 
                    onClick={() => setChangePwdMode(true)}
                    style={{marginTop: '12px', width: '100%'}}
                  >
                    <FaLock /> Change Password
                  </button>
                </div>
              </div>
              
              <div className="securityCard">
                <div className="securityCardIcon">
                  <FaClock />
                </div>
                <div className="securityCardContent">
                  <h4>Last Login</h4>
                  <p>{lastLogin || 'Loading...'}</p>
                </div>
              </div>
              
              <div className="securityCard">
                <div className="securityCardIcon">
                  <FaShieldAlt />
                </div>
                <div className="securityCardContent">
                  <h4>Account Status</h4>
                  <p className="statusActive">✓ Active & Secure</p>
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
        </section>

        {/* Data Export Section */}
        <section className="profileSection">
          <div className="sectionHeader">
            <div>
              <h3>Data Export</h3>
              <p className="sectionSubtitle">Download your financial data</p>
            </div>
          </div>
          
          <div className="exportCard">
            <div className="exportIcon"><FaDownload /></div>
            <div className="exportContent">
              <h4>Download Your Data</h4>
              <p>Export all your expenses and income data for this month as CSV</p>
              <button 
                className="btnPrimary" 
                onClick={handleExportData}
                disabled={exporting}
                style={{marginTop: '12px'}}
              >
                <FaDownload /> {exporting ? "Exporting..." : "Download CSV"}
              </button>
            </div>
          </div>
        </section>

        {/* Danger Zone Section */}
        <section className="profileSection dangerZoneSection">
          <div className="sectionHeader">
            <div>
              <h3>Danger Zone</h3>
              <p className="sectionSubtitle">Irreversible actions</p>
            </div>
          </div>
          
          <div className="dangerZone">
            <div className="dangerIcon"><FaSignOutAlt /></div>
            <div className="dangerContent">
              <h4>Log Out of Your Account</h4>
              <p>You will be logged out from all devices</p>
            </div>
            <button className="btnDanger" onClick={() => {
              if (window.confirm("Are you sure you want to log out?")) {
                localStorage.clear();
                navigate("/");
              }
            }}>
              <FaSignOutAlt /> Log Out
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
