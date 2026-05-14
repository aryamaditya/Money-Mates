import React from 'react';
import styles from './MissingIncomePopup.module.css';
import { FaExclamationCircle } from 'react-icons/fa';

const MissingIncomePopup = ({ onAddIncome, onDismiss }) => {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.iconContainer}>
          <FaExclamationCircle className={styles.icon} />
        </div>
        <h2>New Month, New Start!</h2>
        <p>
          It looks like you haven't logged any income for this month yet. 
          Please update your income to keep your financial health insights accurate.
        </p>
        <div className={styles.actionGroup}>
          <button className={styles.actionBtn} onClick={onAddIncome}>
            Add Income Now
          </button>
          <button className={styles.dismissBtn} onClick={onDismiss}>
            I'll update it later
          </button>
        </div>
      </div>
    </div>
  );
};

export default MissingIncomePopup;
