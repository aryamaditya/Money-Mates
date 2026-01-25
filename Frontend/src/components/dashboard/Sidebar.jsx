import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTachometerAlt, FaCalendarAlt, FaUsers, FaLightbulb, FaUser, FaCog, FaSignOutAlt } from 'react-icons/fa';
import styles from './Dashboard.module.css';

/**
 * Navigation items array
 * Defines menu items shown in sidebar
 * isSelected: indicates which item is currently active
 * 
 * Future features: Daily Planner, Groups, AI Insights, Profile, Settings
 * Currently: Dashboard is the main (and only fully implemented) feature
 */
const navItems = [
  { name: 'Dashboard', icon: <FaTachometerAlt />, isSelected: true },
  { name: 'Daily Planner', icon: <FaCalendarAlt />, isSelected: false },
  { name: 'Groups', icon: <FaUsers />, isSelected: false },
  { name: 'AI Insights', icon: <FaLightbulb />, isSelected: false },
  { name: 'Profile', icon: <FaUser />, isSelected: false },
  { name: 'Settings', icon: <FaCog />, isSelected: false },
];

/**
 * Sidebar Component
 * Left navigation sidebar with app logo and menu items
 * Contains logout button for user authentication
 * 
 * Features:
 * - App branding (MoneyMates logo)
 * - Navigation menu with icons
 * - Logout functionality with session cleanup
 */
const Sidebar = () => {
  const navigate = useNavigate();

  /**
   * handleLogout - Clear user session and redirect to login
   * Removes user data from localStorage
   * Navigates back to login page
   */
  const handleLogout = () => {
    localStorage.removeItem('user'); // Remove logged-in user from local storage
    navigate('/'); // Redirect to login page
  };

  return (
    <aside className={styles.sidebar}>
      {/* App branding/logo */}
      <h1 className={styles.sidebarLogo}>MoneyMates</h1>

      {/* Navigation menu */}
      <nav className={styles.sidebarNav}>
        <ul>
          {/* Map through navigation items */}
          {navItems.map((item) => (
            <li key={item.name}>
              <a
                href="#"
                className={item.isSelected ? styles.navLinkActive : styles.navLink}
              >
                <span style={{ marginRight: '10px' }}>{item.icon}</span>
                {item.name}
              </a>
            </li>
          ))}

          {/* Separator line */}
          <li className={styles.navSeparator}></li>

          {/* Logout button */}
          <li>
            <button 
              onClick={handleLogout} 
              className={styles.navLinkLogout}
            >
              <FaSignOutAlt style={{ marginRight: '10px' }} /> Log Out
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
