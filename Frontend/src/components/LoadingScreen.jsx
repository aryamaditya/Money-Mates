import React from 'react';
import './LoadingScreen.css';
import { FaSpinner } from 'react-icons/fa';

/**
 * LoadingScreen Component
 * Loading animation with multiple display modes:
 * fullScreen={true} = overlay entire viewport (default)
 * fullScreen={false} = fill content area (sidebar-aware)
 * inline={true} = fill parent container (component-level, small box)
 */
const LoadingScreen = ({ message = 'Loading your financial data...', fullScreen = true, inline = false }) => {
  let screenClass = 'loading-screen-full';
  
  if (inline) {
    screenClass = 'loading-screen-inline';
  } else if (!fullScreen) {
    screenClass = 'loading-screen-content';
  }

  return (
    <div className={`loading-screen ${screenClass}`}>
      <div className="loading-container">
        {/* Animated Background Blobs */}
        <div className="loading-blob loading-blob-1"></div>
        <div className="loading-blob loading-blob-2"></div>
        <div className="loading-blob loading-blob-3"></div>

        {/* Main Loading Content */}
        <div className="loading-content">
          <div className="loading-spinner">
            <FaSpinner />
          </div>
          <h2 className="loading-title">Money-Mates</h2>
          <p className="loading-message">{message}</p>
          
          {/* Animated Progress Dots */}
          <div className="loading-dots">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        </div>

        {/* Loading Bar - only for full screen variants */}
        {!inline && (
          <div className="loading-bar-container">
            <div className="loading-bar"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingScreen;
