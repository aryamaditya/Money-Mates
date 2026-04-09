import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

// ==========================================
// SIGNUP PAGE COMPONENT
// ==========================================
// This is the signup/registration page where new users create their accounts.
// It handles form input, real-time validation, and API communication with backend.
// ==========================================

export default function Signup() {
  // ========== STATE MANAGEMENT ==========
  // These variables store the form input values
  const navigate = useNavigate(); // Function to navigate to different pages
  const [name, setName] = useState("");            // User's full name
  const [email, setEmail] = useState("");          // User's email address
  const [password, setPassword] = useState("");    // User's chosen password
  const [confirm, setConfirm] = useState("");      // Password confirmation
  const [error, setError] = useState("");          // General error message for display
  const [validationErrors, setValidationErrors] = useState({}); // Object to store field-specific errors
  
  // ========== VALIDATION FUNCTIONS ==========
  // These functions validate individual fields according to business rules
  // They return error message if validation fails, empty string if passes

  // Validate the user's name
  const validateName = (value) => {
    if (!value.trim()) return "Name is required";  // Empty check
    if (value.trim().length < 2) return "Name must be at least 2 characters";  // Minimum length
    if (value.trim().length > 50) return "Name cannot exceed 50 characters";   // Maximum length
    // Regex: only letters, spaces, hyphens, and apostrophes allowed
    if (!/^[a-zA-Z\s'-]+$/.test(value)) return "Name can only contain letters, spaces, hyphens, and apostrophes";
    return ""; // No errors
  };

  // Validate the email address
  const validateEmail = (value) => {
    if (!value.trim()) return "Email is required";  // Empty check
    // Regex: basic email format validation (something@something.something)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return "Please enter a valid email address";
    if (value.length > 100) return "Email is too long";  // Maximum length
    return ""; // No errors
  };

  // Validate the password strength
  const validatePassword = (value) => {
    if (!value) return "Password is required";  // Empty check
    if (value.length < 8) return "Password must be at least 8 characters";  // Minimum length
    if (!/[A-Z]/.test(value)) return "Password must contain at least one uppercase letter";  // Check: A-Z
    if (!/[a-z]/.test(value)) return "Password must contain at least one lowercase letter";  // Check: a-z
    if (!/[0-9]/.test(value)) return "Password must contain at least one number";  // Check: 0-9
    if (!/[!@#$%^&*]/.test(value)) return "Password must contain at least one special character (!@#$%^&*)";  // Check: special chars
    return ""; // No errors
  };

  // Validate that password confirmation matches password
  const validateConfirm = (value) => {
    if (!value) return "Please confirm your password";  // Empty check
    if (value !== password) return "Passwords do not match";  // Match check
    return ""; // No errors
  };

  // ========== EVENT HANDLERS ==========
  // These functions run when user types in form fields (onChange event)
  // They perform real-time validation and update state

  const handleNameChange = (e) => {
    const value = e.target.value;  // Get typed value from input
    setName(value);  // Update name state
    const error = validateName(value);  // Validate the name
    setValidationErrors(prev => ({ ...prev, name: error }));  // Update error state for this field
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;  // Get typed value from input
    setEmail(value);  // Update email state
    const error = validateEmail(value);  // Validate the email
    setValidationErrors(prev => ({ ...prev, email: error }));  // Update error state for this field
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;  // Get typed value from input
    setPassword(value);  // Update password state
    const error = validatePassword(value);  // Validate the password
    setValidationErrors(prev => ({ ...prev, password: error }));  // Update error state for this field
    
    // If user already typed in confirm password, re-validate it
    // (so it doesn't show "passwords don't match" until they're actually different)
    if (confirm) {
      const confirmError = value !== confirm ? "Passwords do not match" : "";
      setValidationErrors(prev => ({ ...prev, confirm: confirmError }));
    }
  };

  const handleConfirmChange = (e) => {
    const value = e.target.value;  // Get typed value from input
    setConfirm(value);  // Update confirm password state
    const error = validateConfirm(value);  // Validate the confirmation
    setValidationErrors(prev => ({ ...prev, confirm: error }));  // Update error state for this field
  };

  // ========== FORM SUBMISSION HANDLER ==========
  // This function runs when user clicks "Create Account" button

  const handleSignup = async (e) => {
    e.preventDefault();  // Prevent default form submission behavior
    setError("");  // Clear any previous error messages

    // Validate ALL fields one final time before submitting
    const nameError = validateName(name);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const confirmError = validateConfirm(confirm);

    // If any field has an error, show them and don't proceed
    if (nameError || emailError || passwordError || confirmError) {
      setValidationErrors({
        name: nameError,
        email: emailError,
        password: passwordError,
        confirm: confirmError,
      });
      setError("Please fix all errors before submitting");
      return;  // Stop here - don't make API call
    }

    // ========== API CALL TO BACKEND ==========
    try {
      // Make POST request to backend signup endpoint
      const response = await fetch("http://localhost:5262/api/users/signup", {
        method: "POST",  // HTTP method
        headers: { "Content-Type": "application/json" },  // Tell backend we're sending JSON
        body: JSON.stringify({ 
          name: name.trim(),      // Send trimmed values to backend
          email: email.trim(), 
          password 
        }),
      });

      // Parse JSON response from backend
      const data = await response.json();

      // ========== HANDLE RESPONSE ==========
      if (response.ok && data.userID) {
        // Success! Backend created the user
        // Redirect to home page (where login likely is)
        navigate("/");
      } else if (!response.ok && data.errors) {
        // Validation error with multiple fields
        // Join all error messages with commas and display
        const messages = Object.values(data.errors).flat().join(", ");
        setError(messages);
      } else if (!response.ok && data.message) {
        // Error with a single message (e.g., "Email already exists")
        setError(data.message);
      } else {
        // Unknown error
        setError("Signup failed. Try again.");
      }
    } catch (err) {
      // Network error - backend server is not reachable
      setError("Backend not reachable.");
    }
  };

  // ========== RENDER (JSX) ==========
  // This is the HTML/UI that gets displayed to the user

  return (
    <div className="page">
      <div className="card left">
        {/* Application branding and title */}
        <div className="brand">
          <h1 className="brand-title">MoneyMates</h1>
          <div className="brand-sub">Smart Expense Tracker</div>
        </div>

        {/* Welcome message */}
        <div className="welcome">
          <h2>Create an Account</h2>
          <p className="muted">Fill in your details to get started</p>
        </div>

        {/* Signup form */}
        <form className="form" onSubmit={handleSignup}>
          
          {/* Name field */}
          <label className="label">Full Name</label>
          <input
            className="input"
            type="text"
            required
            placeholder="Your Name"
            value={name}
            onChange={handleNameChange}
            // Change border color to red if there's a validation error
            style={{borderColor: validationErrors.name ? "red" : ""}}
          />
          {/* Show error message if name validation failed */}
          {validationErrors.name && <p style={{ color: "red", fontSize: "0.85em", marginTop: "4px" }}>{validationErrors.name}</p>}

          {/* Email field */}
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

          {/* Password field */}
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
          {/* Show password requirements as helpful hint */}
          <p style={{ fontSize: "0.8em", color: "#666", marginTop: "4px" }}>
            Password must have: 8+ chars, uppercase, lowercase, number, special character (!@#$%^&*)
          </p>

          {/* Confirm password field */}
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

          {/* Show general error message if something went wrong */}
          {error && <p style={{ color: "red", marginTop: "8px", fontWeight: "bold" }}>{error}</p>}

          {/* Submit button */}
          <button className="btn-primary" type="submit">
            Create Account
          </button>

          {/* Link to login page for existing users */}
          <p className="center muted">
            Already have an account? <Link to="/" className="link">Log in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
