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

  // Validation rules
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

  // Handle field changes with real-time validation
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
    
    // Also revalidate confirm if it was already filled
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

    // Validate all fields before submission
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
    <div className="page">
      <div className="card left">
        <div className="brand">
          <h1 className="brand-title">MoneyMates</h1>
          <div className="brand-sub">Smart Expense Tracker</div>
        </div>

        <div className="welcome">
          <h2>Create an Account</h2>
          <p className="muted">Fill in your details to get started</p>
        </div>

        <form className="form" onSubmit={handleSignup}>
          <label className="label">Full Name</label>
          <input
            className="input"
            type="text"
            required
            placeholder="Your Name"
            value={name}
            onChange={handleNameChange}
            style={{borderColor: validationErrors.name ? "red" : ""}}
          />
          {validationErrors.name && <p style={{ color: "red", fontSize: "0.85em", marginTop: "4px" }}>{validationErrors.name}</p>}

          <label className="label">Email</label>
          <input
            className="input"
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={handleEmailChange}
            style={{borderColor: validationErrors.email ? "red" : ""}}
          />
          {validationErrors.email && <p style={{ color: "red", fontSize: "0.85em", marginTop: "4px" }}>{validationErrors.email}</p>}

          <label className="label">Password</label>
          <input
            className="input"
            type="password"
            required
            placeholder="***********"
            value={password}
            onChange={handlePasswordChange}
            style={{borderColor: validationErrors.password ? "red" : ""}}
          />
          {validationErrors.password && <p style={{ color: "red", fontSize: "0.85em", marginTop: "4px" }}>{validationErrors.password}</p>}
          <p style={{ fontSize: "0.8em", color: "#666", marginTop: "4px" }}>
            Password must have: 8+ chars, uppercase, lowercase, number, special character (!@#$%^&*)
          </p>

          <label className="label">Confirm Password</label>
          <input
            className="input"
            type="password"
            required
            placeholder="***********"
            value={confirm}
            onChange={handleConfirmChange}
            style={{borderColor: validationErrors.confirm ? "red" : ""}}
          />
          {validationErrors.confirm && <p style={{ color: "red", fontSize: "0.85em", marginTop: "4px" }}>{validationErrors.confirm}</p>}

          {error && <p style={{ color: "red", marginTop: "8px", fontWeight: "bold" }}>{error}</p>}

          <button className="btn-primary" type="submit">
            Create Account
          </button>

          <p className="center muted">
            Already have an account? <Link to="/" className="link">Log in</Link>
          </p>
        </form>
      </div>

      <div className="card right">{/* promo panel */}</div>
    </div>
  );
}
