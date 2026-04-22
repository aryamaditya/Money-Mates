import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Load saved email on component mount
  useEffect(() => {
    const savedEmail = localStorage.getItem("savedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:5262/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        // Save user info in localStorage
        localStorage.setItem("user", JSON.stringify(data));
        
        // Save email if "Remember me" is checked
        if (rememberMe) {
          localStorage.setItem("savedEmail", email);
        } else {
          localStorage.removeItem("savedEmail");
        }
        
        // Redirect directly to dashboard
        navigate("/dashboard");
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
            autoComplete="off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label className="label">Password</label>
          <input
            className="input"
            type="password"
            placeholder="***********"
            required
            autoComplete="off"
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p style={{ color: "red", marginTop: "8px" }}>{error}</p>}

          <div className="row-between">
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              /> 
              <span>Remember me</span>
            </label>
            <Link to="/forgot-password" className="link">Forgot Password?</Link>
          </div>

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Log In"}
          </button>

          <p className="center muted">
            Don’t have an account? <Link to="/signup" className="link">Sign up</Link>
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
