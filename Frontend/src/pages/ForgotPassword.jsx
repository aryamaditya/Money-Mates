import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";
import "../pages/ForgotPassword.css";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("http://localhost:5262/api/users/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setEmailVerified(true);
        setMessage("Email verified. You can now reset your password.");
      } else {
        const errData = await response.json();
        setError(errData.message || "Email not found. Please try again.");
      }
    } catch (err) {
      setError("Backend not reachable. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    // Frontend validation to match backend requirements
    const validationErrors = [];
    if (newPassword.length < 8)
      validationErrors.push("Password must be at least 8 characters");
    if (!/[A-Z]/.test(newPassword))
      validationErrors.push("Password must contain at least one uppercase letter");
    if (!/[a-z]/.test(newPassword))
      validationErrors.push("Password must contain at least one lowercase letter");
    if (!/[0-9]/.test(newPassword))
      validationErrors.push("Password must contain at least one number");
    if (!/[!@#$%^&*]/.test(newPassword))
      validationErrors.push("Password must contain at least one special character (!@#$%^&*)");

    if (validationErrors.length > 0) {
      setError(validationErrors.join("\n"));
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:5262/api/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      });

      if (response.ok) {
        setShowSuccessModal(true);
        setTimeout(() => {
          navigate("/");
        }, 2500);
      } else {
        const errData = await response.json();
        // Handle both message and errors array from backend
        if (errData.errors && Array.isArray(errData.errors)) {
          setError(errData.errors.join("\n"));
        } else {
          setError(errData.message || "Failed to reset password. Please try again.");
        }
      }
    } catch (err) {
      setError("Backend not reachable. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page">
        {/* Full Page Video Background */}
        <video autoPlay muted loop playsInline className="page-bg-video">
          <source src="/videos/final video.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Page Content Overlay */}
        <div className="page-content">
          {/* Logo positioned top-right */}
          <img src="/logos/logo.png" alt="MoneyMates Logo" className="page-logo" />
          
          <div className="card left">
            <div className="login-content">
              <div className="brand">
                <h1 className="brand-title">MoneyMates</h1>
                <div className="brand-sub">Smart Expense Tracker</div>
              </div>

              <div className="welcome">
                <h2>Reset Your Password</h2>
                <p className="muted">
                  {emailVerified
                    ? "Enter your new password"
                    : "Enter your email address to reset your password"}
                </p>
              </div>

              {!emailVerified ? (
                <form className="form" onSubmit={handleVerifyEmail}>
                  <label className="label">Email Address</label>
                  <input
                    className="input"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />

                  {error && <p style={{ color: "red", marginTop: "8px" }}>{error}</p>}
                  {message && <p style={{ color: "green", marginTop: "8px" }}>{message}</p>}

                  <button className="btn-primary" type="submit" disabled={loading}>
                    {loading ? "Verifying..." : "Verify Email"}
                  </button>
                </form>
              ) : (
                <form className="form" onSubmit={handleResetPassword}>
                  <label className="label">New Password</label>
                  <input
                    className="input"
                    type="password"
                    placeholder="At least 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />

                  <label className="label">Confirm Password</label>
                  <input
                    className="input"
                    type="password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />

                  {error && <p style={{ color: "red", marginTop: "8px" }}>{error}</p>}

                  <button className="btn-primary" type="submit" disabled={loading}>
                    {loading ? "Resetting..." : "Reset Password"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEmailVerified(false);
                      setEmail("");
                      setNewPassword("");
                      setConfirmPassword("");
                      setError("");
                      setMessage("");
                    }}
                    className="btn-secondary"
                  >
                    Back to Email
                  </button>
                </form>
              )}

              <p className="center muted" style={{ marginTop: "20px" }}>
                Remember your password? <Link to="/" className="link">Log in</Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Password Reset Success Modal */}
      {showSuccessModal && (
        <div className="login-success-overlay">
          <div className="login-success-modal">
            <div className="success-icon">✓</div>
            <h2>Password Changed Successfully!</h2>
            <p>Your password has been reset.</p>
            <p className="redirect-text">Redirecting to login...</p>
          </div>
        </div>
      )}
    </div>
  );
}
