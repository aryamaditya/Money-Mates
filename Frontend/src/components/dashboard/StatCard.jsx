import React from 'react';
import styles from './Dashboard.module.css';

const StatCard = ({ iconColor, title, amount, icon }) => {
  return (
    <div className={styles.statCard}>
      <div className={styles.iconWrapper} style={{ backgroundColor: iconColor }}>
        <span className={styles.statIcon}>{icon}</span>
      </div>
      <div className={styles.statInfo}>
        <p className={styles.statTitle}>{title}</p>
        <h3 className={styles.statAmount}>{amount}</h3>
      </div>
    </div>
  );
};

export default StatCard;
