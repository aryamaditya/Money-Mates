import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTachometerAlt, FaCalendarAlt, FaUsers, FaLightbulb, FaUser, FaCog, FaSignOutAlt } from 'react-icons/fa';
import styles from './Dashboard.module.css';

const navItems = [
  { name: 'Dashboard', icon: <FaTachometerAlt />, isSelected: true },
  { name: 'Daily Planner', icon: <FaCalendarAlt />, isSelected: false },
  { name: 'Groups', icon: <FaUsers />, isSelected: false },
  { name: 'AI Insights', icon: <FaLightbulb />, isSelected: false },
  { name: 'Profile', icon: <FaUser />, isSelected: false },
  { name: 'Settings', icon: <FaCog />, isSelected: false },
];

const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('user'); // remove logged-in user
    navigate('/'); // redirect to login page
  };

  return (
    <aside className={styles.sidebar}>
      <h1 className={styles.sidebarLogo}>MoneyMates</h1>
      <nav className={styles.sidebarNav}>
        <ul>
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
          <li className={styles.navSeparator}></li>
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
