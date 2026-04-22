import { useNavigate } from "react-router-dom";
import "./Landing.css";

function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      {/* Video Background */}
      <video autoPlay loop muted className="landing-video">
        <source src="/videos/landing-video.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Content Overlay */}
      <div className="landing-overlay"></div>

      {/* Navigation Bar */}
      <nav className="landing-navbar">
        <div className="navbar-buttons">
          <button 
            className="nav-btn login-btn"
            onClick={() => navigate("/login")}
          >
            Login
          </button>
          <button 
            className="nav-btn signup-btn"
            onClick={() => navigate("/signup")}
          >
            Sign Up
          </button>
        </div>
      </nav>

      {/* Center Content */}
      <div className="landing-content">
        <div className="fade-in-group">
          <div className="logo-wrapper">
            <img 
              src="/logos/logo.png" 
              alt="MoneyMates Logo" 
              className="landing-logo"
            />
          </div>
          <div className="title-wrapper">
            <h1 className="landing-title">
              <span className="title-money">Money</span>
              <span className="title-mates">Mates</span>
            </h1>
            <p className="landing-tagline">Smart Expense Tracker</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Landing;
