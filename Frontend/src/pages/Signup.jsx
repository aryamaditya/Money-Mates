import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    try {
      const response = await fetch("https://localhost:7167/api/users/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }), // No 'id' here
      });

      const data = await response.json();

      if (response.ok && data.userID) {
        // Signup success → redirect to login
        navigate("/");
      } else if (!response.ok && data.errors) {
        // Model validation errors
        const messages = Object.values(data.errors).flat().join(", ");
        setError(messages);
      } else if (!response.ok && data.message) {
        // Custom backend message
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
            onChange={(e) => setName(e.target.value)}
          />

          <label className="label">Email</label>
          <input
            className="input"
            type="email"
            required
            placeholder="you@example.com"
            onChange={(e) => setEmail(e.target.value)}
          />

          <label className="label">Password</label>
          <input
            className="input"
            type="password"
            required
            placeholder="***********"
            onChange={(e) => setPassword(e.target.value)}
          />

          <label className="label">Confirm Password</label>
          <input
            className="input"
            type="password"
            required
            placeholder="***********"
            onChange={(e) => setConfirm(e.target.value)}
          />

          {error && <p style={{ color: "red", marginTop: "8px" }}>{error}</p>}

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
