import React, { useState } from 'react';
import '../styles/Toast.css';
import { FaCheck, FaTimes, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';

let toastId = 0;
let showToastFn = null;

/**
 * Simple Toast Notification System
 * Compatible with React 19
 */
export const showToast = (message, type = 'info', duration = 3000) => {
  if (showToastFn) {
    showToastFn({ id: toastId++, message, type, duration });
  }
};

export const toast = {
  success: (message, duration = 3000) => showToast(message, 'success', duration),
  error: (message, duration = 4000) => showToast(message, 'error', duration),
  warning: (message, duration = 3500) => showToast(message, 'warning', duration),
  info: (message, duration = 3000) => showToast(message, 'info', duration),
};

const getIcon = (type) => {
  switch (type) {
    case 'success': return <FaCheck />;
    case 'error': return <FaTimes />;
    case 'warning': return <FaExclamationTriangle />;
    case 'info': return <FaInfoCircle />;
    default: return <FaInfoCircle />;
  }
};

/**
 * Toast Container Component
 * Place this in your App.jsx
 */
export const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  React.useEffect(() => {
    showToastFn = ({ id, message, type, duration }) => {
      const newToast = { id, message, type };
      setToasts(prev => [...prev, newToast]);

      if (duration) {
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== id));
        }, duration);
      }
    };

    return () => {
      showToastFn = null;
    };
  }, []);

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          <div className="toast-icon">{getIcon(toast.type)}</div>
          <div className="toast-message">{toast.message}</div>
          <button 
            className="toast-close"
            onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
          >
            <FaTimes />
          </button>
        </div>
      ))}
    </div>
  );
};
