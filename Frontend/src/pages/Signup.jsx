import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Signup() {
  const navigate = useNavigate(); 
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  const validateName = (value) => {
    if (!value.trim()) return "Name is required";
    if (value.trim().length < 2) return "Name must be at least 2 characters";
    if (value.trim().length > 50) return "Name cannot exceed 50 characters";
    if (!/^[a-zA-Z\s'-]+$/.test(value)) return "Name can only contain letters, spaces, hyphens, and apostrophes";
    return "";
  };

  const validateEmail = (value) => {
    if (!value.trim()) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return "Please enter a valid email address";
    if (value.length > 100) return "Email is too long";
    return "";
  };

  const validatePassword = (value) => {
    if (!value) return "Password is required";
    if (value.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(value)) return "Password must contain at least one uppercase letter";
    if (!/[a-z]/.test(value)) return "Password must contain at least one lowercase letter";
    if (!/[0-9]/.test(value)) return "Password must contain at least one number";
    if (!/[!@#$%^&*]/.test(value)) return "Password must contain at least one special character (!@#$%^&*)";
    return "";
  };

  const validateConfirm = (value) => {
    if (!value) return "Please confirm your password";
    if (value !== password) return "Passwords do not match";
    return "";
  };

  const handleNameChange = (e) => {
    const value = e.target.value;
    setName(value);
    const error = validateName(value);
    setValidationErrors(prev => ({ ...prev, name: error }));
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    const error = validateEmail(value);
    setValidationErrors(prev => ({ ...prev, email: error }));
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    const error = validatePassword(value);
    setValidationErrors(prev => ({ ...prev, password: error }));
    
    if (confirm) {
      const confirmError = value !== confirm ? "Passwords do not match" : "";
      setValidationErrors(prev => ({ ...prev, confirm: confirmError }));
    }
  };

  const handleConfirmChange = (e) => {
    const value = e.target.value;
    setConfirm(value);
    const error = validateConfirm(value);
    setValidationErrors(prev => ({ ...prev, confirm: error }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    const nameError = validateName(name);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const confirmError = validateConfirm(confirm);

    if (nameError || emailError || passwordError || confirmError) {
      setValidationErrors({
        name: nameError,
        email: emailError,
        password: passwordError,
        confirm: confirmError,
      });
      setError("Please fix all errors before submitting");
      return;
    }

    try {
      const response = await fetch("http://localhost:5262/api/users/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      });

      const data = await response.json();

      if (response.ok && data.userID) {
        navigate("/");
      } else if (!response.ok && data.errors) {
        const messages = Object.values(data.errors).flat().join(", ");
        setError(messages);
      } else if (!response.ok && data.message) {
        setError(data.message);
      } else {
        setError("Signup failed. Try again.");
      }
    } catch (err) {
      setError("Backend not reachable.");
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
          <div className="signup-brand">
            <h1 className="brand-title">MoneyMates</h1>
            <div className="brand-sub">Smart Expense Tracker & Financial Management</div>
          </div>

          <div className="welcome">
            <h2>Create Your Account</h2>
            <p className="muted">Join our community and take control of your finances</p>
          </div>

          <form className="form" onSubmit={handleSignup}>
            <label className="label">Full Name</label>
            <input
              className={`input ${validationErrors.name ? "error" : ""}`}
              type="text"
              required
              placeholder="John Doe"
              value={name}
              onChange={handleNameChange}
              autoComplete="off"
            />
            {validationErrors.name && <p className="error-message">{validationErrors.name}</p>}

            <label className="label">Email Address</label>
            <input
              className={`input ${validationErrors.email ? "error" : ""}`}
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={handleEmailChange}
              autoComplete="off"
            />
            {validationErrors.email && <p className="error-message">{validationErrors.email}</p>}

            <label className="label">Password</label>
            <input
              className={`input ${validationErrors.password ? "error" : ""}`}
              type="password"
              required
              placeholder="Create a strong password"
              value={password}
              onChange={handlePasswordChange}
              autoComplete="new-password"
            />
            {validationErrors.password && <p className="error-message">{validationErrors.password}</p>}
            <p className="helper-text">
              Must include: 8+ chars, uppercase, lowercase, number, special character (!@#$%^&*)
            </p>

            <label className="label">Confirm Password</label>
            <input
              className={`input ${validationErrors.confirm ? "error" : ""}`}
              type="password"
              required
              placeholder="Confirm your password"
              value={confirm}
              onChange={handleConfirmChange}
              autoComplete="new-password"
            />
            {validationErrors.confirm && <p className="error-message">{validationErrors.confirm}</p>}

            {error && <div className="error-banner">{error}</div>}

            <button className="btn-primary" type="submit">
              Create Account
            </button>

            <p className="center muted">
              Already have an account? <Link to="/login" className="link">Log in here</Link>
            </p>
          </form>
        </div>
      </div>
      </div>
      </div>

      {/* About Us Section */}
      <div className="about-us-section">
        {/* Video Background for About Us */}
        <video autoPlay muted loop playsInline className="about-bg-video">
          <source src="/videos/Video 3.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        
        <div className="about-container">
          <h2 className="about-title">About MoneyMates</h2>
          <p className="about-subtitle">Smart expense tracking for you and your friends</p>

          <div className="features-grid">
            <div className="feature-card">
              <h3 className="feature-title">Smart Tracking</h3>
              <p className="feature-desc">Track your daily expenses effortlessly with our intuitive dashboard</p>
            </div>

            <div className="feature-card">
              <h3 className="feature-title">Group Expenses</h3>
              <p className="feature-desc">Split expenses with friends and settle debts easily</p>
            </div>

            <div className="feature-card">
              <h3 className="feature-title">Analytics</h3>
              <p className="feature-desc">Visualize spending patterns with detailed charts and reports</p>
            </div>

            <div className="feature-card">
              <h3 className="feature-title">Secure</h3>
              <p className="feature-desc">Your financial data is encrypted and protected</p>
            </div>

            <div className="feature-card">
              <h3 className="feature-title">Responsive</h3>
              <p className="feature-desc">Access your finances on any device, anytime, anywhere</p>
            </div>

            <div className="feature-card">
              <h3 className="feature-title">Group Chat</h3>
              <p className="feature-desc">Communicate with your group members in real-time</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
