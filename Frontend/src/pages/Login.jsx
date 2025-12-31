import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("https://localhost:7167/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        // Save user info in localStorage
        localStorage.setItem("user", JSON.stringify(data));
        // Redirect to dashboard
        if (data.isFirstLogin) {
          navigate("/setup"); // new page
        } else {
          navigate("/dashboard");
  }
      } else {
        const errData = await response.json();
        setError(errData.message || "Invalid email or password");
      }
    } catch (err) {
      setError("Backend not reachable.");
    } finally {
      setLoading(false);
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
          <h2>Welcome Back</h2>
          <p className="muted">Enter your credentials to access your account</p>
        </div>

        <form className="form" onSubmit={handleLogin}>
          <label className="label">Email</label>
          <input
            className="input"
            type="email"
            placeholder="you@example.com"
            required
            onChange={(e) => setEmail(e.target.value)}
          />

          <label className="label">Password</label>
          <input
            className="input"
            type="password"
            placeholder="***********"
            required
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p style={{ color: "red", marginTop: "8px" }}>{error}</p>}

          <div className="row-between">
            <label className="checkbox-label">
              <input type="checkbox" /> <span>Remember me</span>
            </label>
            <a href="#" className="link">Forgot Password?</a>
          </div>

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Log In"}
          </button>

          <p className="center muted">
            Don’t have an account? <Link to="/signup" className="link">Sign up</Link>
          </p>
        </form>
      </div>

      <div className="card right">
        <div className="promo">
          <h2>Take control of your finances</h2>
          <p className="muted light">
            Track expenses, get AI-powered insights and achieve your financial goals with ease.
          </p>

          <div className="feature">
            <div className="feature-icon"></div>
            <div>
              <div className="feature-title">Smart Analytics</div>
              <div className="feature-sub muted">Visualize spending patterns</div>
            </div>
          </div>

          <div className="feature">
            <div className="feature-icon"></div>
            <div>
              <div className="feature-title">AI Suggestions</div>
              <div className="feature-sub muted">Get personalized saving tips</div>
            </div>
          </div>

          <div className="feature">
            <div className="feature-icon"></div>
            <div>
              <div className="feature-title">Group Expenses</div>
              <div className="feature-sub muted">Split bills with friends</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
