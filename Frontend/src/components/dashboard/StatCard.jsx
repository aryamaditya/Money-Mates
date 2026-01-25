import React from 'react';
import styles from './Dashboard.module.css';

/**
 * StatCard Component
 * Displays a single statistic card (e.g., Total Income, Total Expenses, Balance)
 * Used in Dashboard to show financial overview
 * 
 * @param {Object} props
 * @param {string} props.iconColor - Background color for the icon (e.g., '#f06292')
 * @param {string} props.title - Card title (e.g., 'Total Balance')
 * @param {string} props.amount - Amount to display (e.g., 'Rs 50,000')
 * @param {string} props.icon - Emoji icon to display (e.g., '💰')
 */
const StatCard = ({ iconColor, title, amount, icon }) => {
  return (
    <div className={styles.statCard}>
      {/* Icon container with background color */}
      <div className={styles.iconWrapper} style={{ backgroundColor: iconColor }}>
        <span className={styles.statIcon}>{icon}</span>
      </div>

      {/* Title and amount text */}
      <div className={styles.statInfo}>
        <p className={styles.statTitle}>{title}</p>
        <h3 className={styles.statAmount}>{amount}</h3>
      </div>
    </div>
  );
};

export default StatCard;
