import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaTachometerAlt, FaUsers, FaUser, FaSignOutAlt, FaHistory, FaBrain } from 'react-icons/fa';
import styles from './Dashboard.module.css';

/**
 * Navigation items array
 * Defines menu items shown in sidebar
 * path: route to navigate to
 * 
 * Currently implemented: Dashboard, Groups, Profile
 * Future features: More analytics modules
 */
const navItems = [
  { name: 'Dashboard', icon: <FaTachometerAlt />, path: '/dashboard' },
  { name: 'Past Data', icon: <FaHistory />, path: '/past-data' },
  { name: 'Groups', icon: <FaUsers />, path: '/groups' },
  { name: 'AI Insights', icon: <FaBrain />, path: '/ai-insights' },
  { name: 'Profile', icon: <FaUser />, path: '/profile' },
];

/**
 * Sidebar Component
 * Left navigation sidebar with app logo and menu items
 * Contains logout button for user authentication
 * 
 * Features:
 * - App branding (MoneyMates logo)
 * - Dynamic active state based on current route
 * - Navigation menu with icons
 * - Logout functionality with session cleanup
 */
const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  /**
   * handleLogout - Clear user session and redirect to login
   * Removes user data from localStorage
   * Navigates back to login page
   */
  const handleLogout = () => {
    localStorage.removeItem('user'); // Remove logged-in user from local storage
    navigate('/'); // Redirect to login page
  };

  /**
   * handleNavClick - Navigate to menu item if path is valid
   * @param {string} path - The path to navigate to
   */
  const handleNavClick = (path) => {
    if (path && path !== '#') {
      navigate(path);
    }
  };

  /**
   * isActive - Check if a nav item is the current active route
   * @param {string} path - The path to check
   * @returns {boolean} True if the path matches current location
   */
  const isActive = (path) => {
    return location.pathname === path;
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
                href={item.path}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(item.path);
                }}
                className={isActive(item.path) ? styles.navLinkActive : styles.navLink}
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
