import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTachometerAlt, FaUsers, FaLightbulb, FaUser, FaSignOutAlt } from 'react-icons/fa';
import styles from './Dashboard.module.css';

/**
 * Navigation items array
 * Defines menu items shown in sidebar
 * isSelected: indicates which item is currently active
 * 
 * Currently implemented: Dashboard, Groups, Profile
 * Future features: AI Insights
 */
const navItems = [
  { name: 'Dashboard', icon: <FaTachometerAlt />, isSelected: true, path: '/dashboard' },
  { name: 'Groups', icon: <FaUsers />, isSelected: false, path: '/groups' },
  { name: 'AI Insights', icon: <FaLightbulb />, isSelected: false, path: '#' },
  { name: 'Profile', icon: <FaUser />, isSelected: false, path: '/profile' },
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

  /**
   * handleNavClick - Navigate to menu item if path is valid
   * @param {string} path - The path to navigate to
   */
  const handleNavClick = (path) => {
    if (path && path !== '#') {
      navigate(path);
    }
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
